const sql = require('mssql');
(async () => {
  const config = {
    server: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    user: process.env.DB_USERNAME || 'sa',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'YT_MES',
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
  };
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT TOP 5 id, username, password, real_name, role_code, is_active, login_attempts, locked_until FROM sys_user WHERE username = 'admin'");
    console.log(JSON.stringify(result.recordset, null, 2));
    await pool.close();
  } catch (err) {
    console.error('DB_QUERY_ERROR');
    console.error(err.message);
    process.exit(1);
  }
})();
