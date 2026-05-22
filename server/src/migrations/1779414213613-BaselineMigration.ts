import { MigrationInterface, QueryRunner } from "typeorm";

export class BaselineMigration1779414213613 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ========== 系统基础表 ==========
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_user')
            CREATE TABLE sys_user (
                id              INT             IDENTITY(1,1) PRIMARY KEY,
                username        NVARCHAR(50)    NOT NULL UNIQUE,
                password        NVARCHAR(255)   NOT NULL,
                real_name       NVARCHAR(50)    NOT NULL,
                role_code       INT             NOT NULL DEFAULT 1,
                phone           NVARCHAR(20)    NULL,
                is_active       BIT             NOT NULL DEFAULT 1,
                login_attempts  INT             NOT NULL DEFAULT 0,
                locked_until    DATETIME2       NULL,
                created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
                updated_at      DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_department')
            CREATE TABLE sys_department (
                id              INT             IDENTITY(1,1) PRIMARY KEY,
                name            NVARCHAR(100)   NOT NULL,
                code            NVARCHAR(20)    NOT NULL UNIQUE,
                is_active       BIT             NOT NULL DEFAULT 1,
                created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
                updated_at      DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_equipment')
            CREATE TABLE sys_equipment (
                id              INT             IDENTITY(1,1) PRIMARY KEY,
                equipment_code  NVARCHAR(50)    NOT NULL UNIQUE,
                equipment_name  NVARCHAR(100)   NOT NULL,
                model           NVARCHAR(50)    NULL,
                department_code NVARCHAR(50)    NULL,
                is_active       BIT             NOT NULL DEFAULT 1,
                created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
                updated_at      DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_config')
            CREATE TABLE sys_config (
                id              INT             IDENTITY(1,1) PRIMARY KEY,
                [key]           NVARCHAR(255)   NOT NULL UNIQUE,
                [value]         NVARCHAR(MAX)   NOT NULL,
                description     NVARCHAR(500)   NULL,
                updated_at      DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sys_log')
            CREATE TABLE sys_log (
                id              INT             IDENTITY(1,1) PRIMARY KEY,
                user_id         INT             NOT NULL,
                username        NVARCHAR(255)   NOT NULL,
                action          NVARCHAR(255)   NOT NULL,
                module          NVARCHAR(255)   NOT NULL,
                detail          NVARCHAR(MAX)   NULL,
                ip              NVARCHAR(255)   NULL,
                created_at      DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        // ========== 批次管理表 ==========
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'batch')
            CREATE TABLE batch (
                batch_no            NVARCHAR(16)    NOT NULL PRIMARY KEY,
                product_model       NVARCHAR(128)   NOT NULL,
                workshop            NVARCHAR(64)    NOT NULL,
                shift               NVARCHAR(32)    NOT NULL,
                planned_qty         INT             NOT NULL,
                actual_start_date   DATE            NOT NULL,
                status              TINYINT         NOT NULL DEFAULT 1,
                remarks             NVARCHAR(500)   NULL,
                created_by          INT             NOT NULL,
                created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
                updated_by          INT             NULL,
                updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'batch_status_log')
            CREATE TABLE batch_status_log (
                id              INT             IDENTITY(1,1) PRIMARY KEY,
                batch_no        NVARCHAR(16)    NOT NULL,
                from_status     TINYINT         NOT NULL,
                to_status       TINYINT         NOT NULL,
                changed_by      INT             NOT NULL,
                change_reason   NVARCHAR(256)   NULL,
                created_at      DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        // ========== 工序记录表（13个工序） ==========
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'batching_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'coating_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roller_pressing_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'slitting_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sorting_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'electrode_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'winding_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'assembly_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'baking_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'injection_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'wrapping_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'formation_record')
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
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'grading_record')
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
            )
        `);

        // ========== 品质检查表 ==========
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'quality_check')
            CREATE TABLE quality_check (
                id                  INT             IDENTITY(1,1) PRIMARY KEY,
                batch_no            NVARCHAR(16)    NOT NULL,
                process_type        NVARCHAR(32)    NOT NULL,
                inspection_result   TINYINT         NOT NULL,
                defect_qty          INT             NULL,
                defect_reason       NVARCHAR(512)   NULL,
                inspector_name      NVARCHAR(32)    NOT NULL,
                abnormal_record     NVARCHAR(512)   NULL,
                created_by          INT             NOT NULL,
                created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
                updated_by          INT             NULL,
                updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        // ========== 材料仓库表 ==========
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'material_warehouse')
            CREATE TABLE material_warehouse (
                id                  INT             IDENTITY(1,1) PRIMARY KEY,
                batch_no            NVARCHAR(16)    NOT NULL,
                material_type       TINYINT         NOT NULL,
                supplier_batch_no   NVARCHAR(32)    NOT NULL,
                quantity            DECIMAL(12,3)   NOT NULL,
                unit                NVARCHAR(16)    NOT NULL DEFAULT 'kg',
                created_by          INT             NOT NULL,
                created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
                updated_by          INT             NULL,
                updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        // ========== 电芯条码表 ==========
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cell_barcode')
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
            )
        `);

        // ========== 工序词典表 ==========
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'process_dictionary')
            CREATE TABLE process_dictionary (
                id                  INT             IDENTITY(1,1) PRIMARY KEY,
                process_code        NVARCHAR(255)   NOT NULL UNIQUE,
                process_name        NVARCHAR(255)   NOT NULL,
                sort_order          INT             NOT NULL DEFAULT 0,
                is_active           BIT             NOT NULL DEFAULT 1,
                description         NVARCHAR(255)   NULL,
                field_definitions   NVARCHAR(MAX)   NULL,
                created_at          DATETIME2       NOT NULL DEFAULT GETDATE(),
                updated_at          DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        // ========== Pack（模组）表 ==========
        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pack')
            CREATE TABLE pack (
                id                      INT             IDENTITY(1,1) PRIMARY KEY,
                pack_barcode            NVARCHAR(64)    NOT NULL UNIQUE,
                batch_no                NVARCHAR(64)    NULL,
                protection_board_barcode NVARCHAR(64)   NULL,
                operator_name           NVARCHAR(64)    NULL,
                created_at              DATETIME2       NOT NULL DEFAULT GETDATE()
            )
        `);

        await queryRunner.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pack_cell')
            CREATE TABLE pack_cell (
                id              INT             IDENTITY(1,1) PRIMARY KEY,
                cell_barcode    NVARCHAR(64)    NOT NULL,
                pack_id         INT             NOT NULL
            )
        `);

        // ========== 索引 ==========
        const indexes = [
            'CREATE INDEX IX_sys_user_username ON sys_user (username)',
            'CREATE INDEX IX_batch_status ON batch (status)',
            'CREATE INDEX IX_batch_created_at ON batch (created_at)',
            'CREATE INDEX IX_batch_status_log_batch_no ON batch_status_log (batch_no)',
            'CREATE INDEX IX_batching_record_batch_no ON batching_record (batch_no)',
            'CREATE INDEX IX_coating_record_batch_no ON coating_record (batch_no)',
            'CREATE INDEX IX_roller_pressing_record_batch_no ON roller_pressing_record (batch_no)',
            'CREATE INDEX IX_slitting_record_batch_no ON slitting_record (batch_no)',
            'CREATE INDEX IX_sorting_record_batch_no ON sorting_record (batch_no)',
            'CREATE INDEX IX_electrode_record_batch_no ON electrode_record (batch_no)',
            'CREATE INDEX IX_winding_record_batch_no ON winding_record (batch_no)',
            'CREATE INDEX IX_assembly_record_batch_no ON assembly_record (batch_no)',
            'CREATE INDEX IX_baking_record_batch_no ON baking_record (batch_no)',
            'CREATE INDEX IX_injection_record_batch_no ON injection_record (batch_no)',
            'CREATE INDEX IX_wrapping_record_batch_no ON wrapping_record (batch_no)',
            'CREATE INDEX IX_formation_record_batch_no ON formation_record (batch_no)',
            'CREATE INDEX IX_grading_record_batch_no ON grading_record (batch_no)',
            'CREATE INDEX IX_quality_check_batch_no ON quality_check (batch_no)',
            'CREATE INDEX IX_quality_check_process_type ON quality_check (process_type)',
            'CREATE INDEX IX_material_warehouse_batch_no ON material_warehouse (batch_no)',
            'CREATE INDEX IX_material_warehouse_type ON material_warehouse (material_type)',
            'CREATE INDEX IX_cell_barcode_batch_no ON cell_barcode (batch_no)',
        ];

        for (const idx of indexes) {
            await queryRunner.query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = '${idx.split(' ')[2]}')
                ${idx}
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 按依赖顺序删除表（先删子表，再删主表）
        const tables = [
            'pack_cell',
            'pack',
            'process_dictionary',
            'cell_barcode',
            'material_warehouse',
            'quality_check',
            'grading_record',
            'formation_record',
            'wrapping_record',
            'injection_record',
            'baking_record',
            'assembly_record',
            'winding_record',
            'electrode_record',
            'sorting_record',
            'slitting_record',
            'roller_pressing_record',
            'coating_record',
            'batching_record',
            'batch_status_log',
            'batch',
            'sys_log',
            'sys_config',
            'sys_equipment',
            'sys_department',
            'sys_user',
        ];

        for (const table of tables) {
            await queryRunner.query(`IF OBJECT_ID('${table}', 'U') IS NOT NULL DROP TABLE ${table}`);
        }
    }

}
