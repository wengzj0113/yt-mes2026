const sql = require('mssql');

const localConfig = {
    user: 'sa',
    password: '123',
    server: '127.0.0.1',
    port: 1433,
    database: 'YT_MES',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const remoteConfig = {
    user: 'sa',
    password: '123',
    server: '192.168.3.147',
    port: 1433,
    database: 'YT_MES',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function sync() {
    console.log('开始连接本地和远程数据库...');
    let localPool, remotePool;
    try {
        localPool = await sql.connect(localConfig);
        console.log('本地数据库连接成功！');
        
        remotePool = await new sql.ConnectionPool(remoteConfig).connect();
        console.log('远程数据库连接成功！');

        // 1. 获取所有用户表
        const tablesResult = await localPool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
              AND TABLE_CATALOG = 'YT_MES'
              AND TABLE_NAME NOT LIKE 'sysdiagrams'
        `);
        const tables = tablesResult.recordset.map(r => r.TABLE_NAME);
        console.log(`找到 ${tables.length} 个表需要同步:`, tables.join(', '));

        // 2. 禁用远程数据库的所有外键约束
        console.log('正在禁用远程数据库外键约束...');
        for (const table of tables) {
            await remotePool.request().query(`ALTER TABLE [${table}] NOCHECK CONSTRAINT ALL`);
        }

        // 3. 清空远程数据库表中的旧数据 (使用 DELETE，因为 TRUNCATE 不允许有外键引用的表)
        console.log('正在清空远程数据库旧数据...');
        // 按照依赖关系反向删除，或者直接 DELETE (已禁用约束，直接 DELETE 即可)
        for (const table of tables) {
            console.log(`清空表: ${table}`);
            await remotePool.request().query(`DELETE FROM [${table}]`);
        }

        // 4. 逐表同步数据
        for (const table of tables) {
            console.log(`正在同步表: ${table} ...`);
            
            // 获取本地数据
            const localDataResult = await localPool.request().query(`SELECT * FROM [${table}]`);
            const rows = localDataResult.recordset;
            console.log(`表 ${table} 本地共有 ${rows.length} 条记录`);

            if (rows.length === 0) {
                continue;
            }

            // 检查该表是否有 IDENTITY 列
            const identityResult = await localPool.request().query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = '${table}' 
                  AND COLUMNPROPERTY(object_id('${table}'), COLUMN_NAME, 'IsIdentity') = 1
            `);
            const hasIdentity = identityResult.recordset.length > 0;
            const identityColumn = hasIdentity ? identityResult.recordset[0].COLUMN_NAME : null;
            console.log(`表 ${table} 是否有 IDENTITY 列: ${hasIdentity} (${identityColumn})`);

            // 插入数据
            const columns = Object.keys(rows[0]);
            const columnsStr = columns.map(c => {
                if (c.startsWith('[') && c.endsWith(']')) {
                    return c;
                }
                return `[${c}]`;
            }).join(', ');
            
            // 使用 Transaction 批量插入以提高速度
            const transaction = new sql.Transaction(remotePool);
            await transaction.begin();
            try {
                for (const row of rows) {
                    const request = new sql.Request(transaction);
                    const paramNames = [];
                    
                    columns.forEach((col, index) => {
                        const paramName = `val_${index}`;
                        paramNames.push(`@${paramName}`);
                        
                        // 处理特殊类型，比如 Date 或 Null
                        let val = row[col];
                        request.input(paramName, val);
                    });

                    let insertQuery = '';
                    if (hasIdentity) {
                        insertQuery = `
                            SET IDENTITY_INSERT [${table}] ON;
                            INSERT INTO [${table}] (${columnsStr}) VALUES (${paramNames.join(', ')});
                            SET IDENTITY_INSERT [${table}] OFF;
                        `;
                    } else {
                        insertQuery = `
                            INSERT INTO [${table}] (${columnsStr}) VALUES (${paramNames.join(', ')});
                        `;
                    }
                    await request.query(insertQuery);
                }

                await transaction.commit();
                console.log(`表 ${table} 同步成功，共导入 ${rows.length} 条数据`);
            } catch (err) {
                console.error(`表 ${table} 导入时发生 SQL 错误:`, err);
                try {
                    await transaction.rollback();
                } catch (rollbackErr) {
                    console.error('回滚事务时出错（可能事务已被 SQL Server 自动中止）:', rollbackErr.message);
                }
                throw err;
            }
        }

        // 5. 重新启用远程数据库的所有外键约束
        console.log('正在重新启用远程数据库外键约束...');
        for (const table of tables) {
            await remotePool.request().query(`ALTER TABLE [${table}] WITH CHECK CHECK CONSTRAINT ALL`);
        }

        console.log('🎉 数据库同步圆满完成！');

    } catch (err) {
        console.error('同步过程中发生错误:', err);
    } finally {
        if (localPool) await localPool.close();
        if (remotePool) await remotePool.close();
    }
}

sync();
