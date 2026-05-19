-- ==========================================================
-- YT-MES 电芯生产追溯系统 - 完整数据库建库脚本
-- 目标数据库: SQL Server 2019/2022
-- ==========================================================

-- ==========================================================
-- 1. 创建数据库
-- ==========================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'YT_MES')
BEGIN
    CREATE DATABASE YT_MES;
END
GO

USE YT_MES;
GO

-- ==========================================================
-- 2. 系统基础表
-- ==========================================================

-- 2.1 用户表
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_user')
BEGIN
    CREATE TABLE sys_user (
        id              INT             IDENTITY(1,1) PRIMARY KEY,
        username        NVARCHAR(50)    NOT NULL UNIQUE,
        password        NVARCHAR(255)   NOT NULL,
        real_name       NVARCHAR(50)    NOT NULL,
        role_code       INT             NOT NULL DEFAULT 1,  -- 1=OP 2=QC 3=WH 4=ADMIN
        phone           NVARCHAR(20)    NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        login_attempts  INT             NOT NULL DEFAULT 0,
        locked_until    DATETIME2       NULL,
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 2.2 部门表
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_department')
BEGIN
    CREATE TABLE sys_department (
        id              INT             IDENTITY(1,1) PRIMARY KEY,
        name            NVARCHAR(100)   NOT NULL,
        code            NVARCHAR(20)    NOT NULL UNIQUE,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 2.3 设备表
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_equipment')
BEGIN
    CREATE TABLE sys_equipment (
        id              INT             IDENTITY(1,1) PRIMARY KEY,
        equipment_code  NVARCHAR(50)    NOT NULL UNIQUE,
        equipment_name  NVARCHAR(100)   NOT NULL,
        model           NVARCHAR(50)    NULL,
        department_code NVARCHAR(50)    NULL,
        is_active       BIT             NOT NULL DEFAULT 1,
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_at      DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ==========================================================
-- 3. 批次管理表
-- ==========================================================

-- 3.1 批次表
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'batch')
BEGIN
    CREATE TABLE batch (
        batch_no            NVARCHAR(16)    NOT NULL PRIMARY KEY,
        product_model       NVARCHAR(128)   NOT NULL,
        workshop            NVARCHAR(64)    NOT NULL,
        shift               NVARCHAR(32)    NOT NULL,
        planned_qty         INT             NOT NULL,
        actual_start_date   DATE            NOT NULL,
        status              TINYINT         NOT NULL DEFAULT 1,  -- 1=DRAFT 2=IP 3=DONE 4=CLOSED
        remarks             NVARCHAR(500)   NULL,
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 3.2 批次状态变更日志表
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'batch_status_log')
BEGIN
    CREATE TABLE batch_status_log (
        id              INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no        NVARCHAR(16)    NOT NULL,
        from_status     TINYINT         NOT NULL,
        to_status       TINYINT         NOT NULL,
        changed_by      INT             NOT NULL,
        change_reason   NVARCHAR(256)   NULL,
        created_at      DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ==========================================================
-- 4. 工序记录表（13个工序）
-- ==========================================================

-- 4.1 配料记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'batching_record')
BEGIN
    CREATE TABLE batching_record (
        id                  INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no            NVARCHAR(16)    NOT NULL,
        record_status       TINYINT         NOT NULL DEFAULT 1,
        is_draft            BIT             NOT NULL DEFAULT 1,
        positive_material   NVARCHAR(128)   NOT NULL,
        negative_material   NVARCHAR(128)   NOT NULL,
        viscosity_record    NVARCHAR(256)   NULL,
        operator_name       NVARCHAR(32)    NOT NULL,
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.2 涂布记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'coating_record')
BEGIN
    CREATE TABLE coating_record (
        id                      INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no                NVARCHAR(16)    NOT NULL,
        record_status           TINYINT         NOT NULL DEFAULT 1,
        is_draft                BIT             NOT NULL DEFAULT 1,
        equipment_code          NVARCHAR(16)    NOT NULL,
        coating_speed           DECIMAL(8,2)    NOT NULL,
        coating_thickness_pos   DECIMAL(8,2)    NOT NULL,
        coating_thickness_neg   DECIMAL(8,2)    NOT NULL,
        areal_density_pos       DECIMAL(8,2)    NOT NULL,
        areal_density_neg       DECIMAL(8,2)    NOT NULL,
        coating_temperature     DECIMAL(8,2)    NOT NULL,
        operator_name           NVARCHAR(32)    NOT NULL,
        created_by              INT             NOT NULL,
        created_at              DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by              INT             NULL,
        updated_at              DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.3 辊压记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roller_pressing_record')
BEGIN
    CREATE TABLE roller_pressing_record (
        id                  INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no            NVARCHAR(16)    NOT NULL,
        record_status       TINYINT         NOT NULL DEFAULT 1,
        is_draft            BIT             NOT NULL DEFAULT 1,
        equipment_code      NVARCHAR(16)    NOT NULL,
        roller_pressure     DECIMAL(8,2)    NOT NULL,
        roller_thickness    DECIMAL(8,2)    NOT NULL,
        roller_speed        DECIMAL(8,2)    NULL,
        operator_name       NVARCHAR(32)    NOT NULL,
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.4 分切记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'slitting_record')
BEGIN
    CREATE TABLE slitting_record (
        id                  INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no            NVARCHAR(16)    NOT NULL,
        record_status       TINYINT         NOT NULL DEFAULT 1,
        is_draft            BIT             NOT NULL DEFAULT 1,
        equipment_code      NVARCHAR(16)    NOT NULL,
        electrode_width     DECIMAL(8,2)    NOT NULL,
        electrode_length    DECIMAL(8,2)    NOT NULL,
        slitting_speed      DECIMAL(8,2)    NULL,
        operator_name       NVARCHAR(32)    NOT NULL,
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.5 分选记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sorting_record')
BEGIN
    CREATE TABLE sorting_record (
        id                  INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no            NVARCHAR(16)    NOT NULL,
        record_status       TINYINT         NOT NULL DEFAULT 1,
        is_draft            BIT             NOT NULL DEFAULT 1,
        equipment_code      NVARCHAR(16)    NOT NULL,
        ocv_voltage_range   NVARCHAR(500)   NOT NULL,
        ir_range            NVARCHAR(500)   NOT NULL,
        capacity_range      NVARCHAR(500)   NOT NULL,
        operator_name       NVARCHAR(32)    NOT NULL,
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.6 极片记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'electrode_record')
BEGIN
    CREATE TABLE electrode_record (
        id                  INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no            NVARCHAR(16)    NOT NULL,
        record_status       TINYINT         NOT NULL DEFAULT 1,
        is_draft            BIT             NOT NULL DEFAULT 1,
        tab_material_spec   NVARCHAR(128)   NOT NULL,
        electrode_length    NVARCHAR(64)    NOT NULL,
        tab_welding_pull    NVARCHAR(64)    NULL,
        operator_name       NVARCHAR(32)    NOT NULL,
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.7 卷绕记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'winding_record')
BEGIN
    CREATE TABLE winding_record (
        id                  INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no            NVARCHAR(16)    NOT NULL,
        record_status       TINYINT         NOT NULL DEFAULT 1,
        is_draft            BIT             NOT NULL DEFAULT 1,
        equipment_code      NVARCHAR(16)    NOT NULL,
        separator_model     NVARCHAR(128)   NOT NULL,
        winding_speed       DECIMAL(8,2)    NOT NULL,
        winding_tension     DECIMAL(8,2)    NOT NULL,
        core_thickness      DECIMAL(8,2)    NULL,
        core_diameter       DECIMAL(8,2)    NULL,
        operator_name       NVARCHAR(32)    NOT NULL,
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.8 组装记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'assembly_record')
BEGIN
    CREATE TABLE assembly_record (
        id                      INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no                NVARCHAR(16)    NOT NULL,
        record_status           TINYINT         NOT NULL DEFAULT 1,
        is_draft                BIT             NOT NULL DEFAULT 1,
        casing_equipment_code   NVARCHAR(16)    NOT NULL,
        shell_model             NVARCHAR(128)   NOT NULL,
        bottom_weld_equipment   NVARCHAR(16)    NOT NULL,
        bottom_weld_params      NVARCHAR(256)   NOT NULL,
        bottom_weld_pull        DECIMAL(8,2)    NULL,
        groove_record           NVARCHAR(256)   NULL,
        cap_model               NVARCHAR(128)   NOT NULL,
        cap_welding_pull        DECIMAL(8,2)    NULL,
        tab_welding_pull        DECIMAL(8,2)    NULL,
        operator_name           NVARCHAR(32)    NOT NULL,
        created_by              INT             NOT NULL,
        created_at              DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by              INT             NULL,
        updated_at              DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.9 烘烤记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'baking_record')
BEGIN
    CREATE TABLE baking_record (
        id                      INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no                NVARCHAR(16)    NOT NULL,
        record_status           TINYINT         NOT NULL DEFAULT 1,
        is_draft                BIT             NOT NULL DEFAULT 1,
        equipment_code          NVARCHAR(16)    NOT NULL,
        baking_temperature      DECIMAL(8,2)    NOT NULL,
        baking_duration         INT             NOT NULL,
        vacuum_level            DECIMAL(8,2)    NULL,
        moisture_after_baking   DECIMAL(8,2)    NULL,
        operator_name           NVARCHAR(32)    NOT NULL,
        created_by              INT             NOT NULL,
        created_at              DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by              INT             NULL,
        updated_at              DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.10 注液记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'injection_record')
BEGIN
    CREATE TABLE injection_record (
        id                      INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no                NVARCHAR(16)    NOT NULL,
        record_status           TINYINT         NOT NULL DEFAULT 1,
        is_draft                BIT             NOT NULL DEFAULT 1,
        equipment_code          NVARCHAR(16)    NOT NULL,
        electrolyte_model       NVARCHAR(128)   NOT NULL,
        injection_amount        DECIMAL(8,2)    NULL,
        injection_humidity      DECIMAL(8,2)    NULL,
        injection_temperature   DECIMAL(8,2)    NULL,
        sealing_dimension       DECIMAL(8,2)    NULL,
        cleaning_record         NVARCHAR(256)   NULL,
        operator_name           NVARCHAR(32)    NOT NULL,
        created_by              INT             NOT NULL,
        created_at              DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by              INT             NULL,
        updated_at              DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.11 包装记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'wrapping_record')
BEGIN
    CREATE TABLE wrapping_record (
        id                  INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no            NVARCHAR(16)    NOT NULL,
        record_status       TINYINT         NOT NULL DEFAULT 1,
        is_draft            BIT             NOT NULL DEFAULT 1,
        equipment_code      NVARCHAR(16)    NOT NULL,
        film_model          NVARCHAR(128)   NOT NULL,
        shrink_temperature  DECIMAL(8,2)    NOT NULL,
        appearance_check    TINYINT         NULL,
        operator_name       NVARCHAR(32)    NOT NULL,
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.12 化成记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'formation_record')
BEGIN
    CREATE TABLE formation_record (
        id                          INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no                    NVARCHAR(16)    NOT NULL,
        record_status               TINYINT         NOT NULL DEFAULT 1,
        is_draft                    BIT             NOT NULL DEFAULT 1,
        equipment_code              NVARCHAR(16)    NOT NULL,
        charge_discharge_template   NVARCHAR(500)   NULL,
        formation_temperature       DECIMAL(8,2)    NULL,
        operator_name               NVARCHAR(32)    NOT NULL,
        created_by                  INT             NOT NULL,
        created_at                  DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by                  INT             NULL,
        updated_at                  DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- 4.13 分容记录
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'grading_record')
BEGIN
    CREATE TABLE grading_record (
        id                          INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no                    NVARCHAR(16)    NOT NULL,
        record_status               TINYINT         NOT NULL DEFAULT 1,
        is_draft                    BIT             NOT NULL DEFAULT 1,
        equipment_code              NVARCHAR(16)    NOT NULL,
        charge_discharge_template   NVARCHAR(500)   NULL,
        grading_temperature         DECIMAL(8,2)    NULL,
        capacity_grade_standard     NVARCHAR(500)   NULL,
        operator_name               NVARCHAR(32)    NOT NULL,
        created_by                  INT             NOT NULL,
        created_at                  DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by                  INT             NULL,
        updated_at                  DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ==========================================================
-- 5. 品质检查表
-- ==========================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'quality_check')
BEGIN
    CREATE TABLE quality_check (
        id                  INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no            NVARCHAR(16)    NOT NULL,
        process_type        NVARCHAR(32)    NOT NULL,
        inspection_result   TINYINT         NOT NULL,       -- 1=合格 2=不合格
        defect_qty          INT             NULL,
        defect_reason       NVARCHAR(512)   NULL,
        inspector_name      NVARCHAR(32)    NOT NULL,
        abnormal_record     NVARCHAR(512)   NULL,
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ==========================================================
-- 6. 材料仓库表
-- ==========================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'material_warehouse')
BEGIN
    CREATE TABLE material_warehouse (
        id                  INT             IDENTITY(1,1) PRIMARY KEY,
        batch_no            NVARCHAR(16)    NOT NULL,
        material_type       TINYINT         NOT NULL,       -- 1=正极 2=负极 3=电解液 4=隔膜 5=外壳/盖帽
        supplier_batch_no   NVARCHAR(32)    NOT NULL,
        quantity            DECIMAL(12,3)   NOT NULL,
        unit                NVARCHAR(16)    NOT NULL DEFAULT 'kg',
        created_by          INT             NOT NULL,
        created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
        updated_by          INT             NULL,
        updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ==========================================================
-- 7. 电芯条码表
-- ==========================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cell_barcode')
BEGIN
    CREATE TABLE cell_barcode (
        id                      INT             IDENTITY(1,1) PRIMARY KEY,
        barcode                 NVARCHAR(32)    NOT NULL UNIQUE,
        batch_no                NVARCHAR(16)    NOT NULL,
        sorting_record_id       INT             NULL,
        voltage                 DECIMAL(6,4)    NULL,
        internal_resistance     DECIMAL(6,2)    NULL,
        capacity                DECIMAL(8,2)    NULL,
        k_value                 DECIMAL(6,4)    NULL,
        sorting_time            DATETIME2       NULL,
        grade                   NVARCHAR(16)    NULL,
        import_source           NVARCHAR(32)    NULL,
        imported_at             DATETIME2       NOT NULL DEFAULT GETDATE(),
        created_at              DATETIME2       NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ==========================================================
-- 8. 索引
-- ==========================================================

-- sys_user
CREATE INDEX IX_sys_user_username ON sys_user (username);

-- batch
CREATE INDEX IX_batch_status ON batch (status);
CREATE INDEX IX_batch_created_at ON batch (created_at);

-- batch_status_log
CREATE INDEX IX_batch_status_log_batch_no ON batch_status_log (batch_no);

-- 工序表索引（所有工序的 batch_no 查询）
CREATE INDEX IX_batching_record_batch_no ON batching_record (batch_no);
CREATE INDEX IX_coating_record_batch_no ON coating_record (batch_no);
CREATE INDEX IX_roller_pressing_record_batch_no ON roller_pressing_record (batch_no);
CREATE INDEX IX_slitting_record_batch_no ON slitting_record (batch_no);
CREATE INDEX IX_sorting_record_batch_no ON sorting_record (batch_no);
CREATE INDEX IX_electrode_record_batch_no ON electrode_record (batch_no);
CREATE INDEX IX_winding_record_batch_no ON winding_record (batch_no);
CREATE INDEX IX_assembly_record_batch_no ON assembly_record (batch_no);
CREATE INDEX IX_baking_record_batch_no ON baking_record (batch_no);
CREATE INDEX IX_injection_record_batch_no ON injection_record (batch_no);
CREATE INDEX IX_wrapping_record_batch_no ON wrapping_record (batch_no);
CREATE INDEX IX_formation_record_batch_no ON formation_record (batch_no);
CREATE INDEX IX_grading_record_batch_no ON grading_record (batch_no);

-- quality_check
CREATE INDEX IX_quality_check_batch_no ON quality_check (batch_no);
CREATE INDEX IX_quality_check_process_type ON quality_check (process_type);

-- material_warehouse
CREATE INDEX IX_material_warehouse_batch_no ON material_warehouse (batch_no);
CREATE INDEX IX_material_warehouse_type ON material_warehouse (material_type);

-- cell_barcode
CREATE INDEX IX_cell_barcode_batch_no ON cell_barcode (batch_no);

GO

-- ==========================================================
-- 9. 种子数据
-- ==========================================================

-- 9.1 默认用户（密码都是 admin123 的 bcrypt 哈希）
IF NOT EXISTS (SELECT * FROM sys_user WHERE username = 'admin')
BEGIN
    INSERT INTO sys_user (username, password, real_name, role_code) VALUES
    (N'admin',      N'$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5GzGkVFQGzJm8XKCBq5q5zKq', N'系统管理员', 4),
    (N'operator1',  N'$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5GzGkVFQGzJm8XKCBq5q5zKq', N'张三',      1),
    (N'operator2',  N'$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5GzGkVFQGzJm8XKCBq5q5zKq', N'李四',      1),
    (N'quality1',   N'$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5GzGkVFQGzJm8XKCBq5q5zKq', N'王五',      2),
    (N'warehouse1', N'$2b$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5GzGkVFQGzJm8XKCBq5q5zKq', N'赵六',      3);
END
GO

-- 9.2 默认部门
IF NOT EXISTS (SELECT * FROM sys_department WHERE code = 'PROD')
BEGIN
    INSERT INTO sys_department (name, code) VALUES
    (N'生产部', 'PROD'),
    (N'品质部', 'QA'),
    (N'仓储部', 'WH'),
    (N'管理部', 'ADMIN');
END
GO

-- 9.3 默认设备
IF NOT EXISTS (SELECT * FROM sys_equipment WHERE equipment_code = 'E001')
BEGIN
    INSERT INTO sys_equipment (equipment_code, equipment_name, department_code) VALUES
    ('E001', N'配料机-01', 'PROD'),
    ('E002', N'涂布机-01', 'PROD'),
    ('E003', N'辊压机-01', 'PROD'),
    ('E004', N'分切机-01', 'PROD');
END
GO

PRINT 'YT-MES 数据库创建完成！';
GO
