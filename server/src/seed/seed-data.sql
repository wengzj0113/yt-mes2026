-- ============================================================
-- YT-MES 种子数据
-- 适用数据库: SQL Server (2022+)
-- 生成日期: 2026-05-12
-- ============================================================
-- 注意事项:
--   1. 用户表密码为 bcrypt($2b$12$) 加密的 "admin123"
--   2. 批次状态: 1=草稿, 2=进行中, 3=已完成, 4=已关闭
--   3. 记录状态: record_status=1 正常, 2 作废; is_draft=1 草稿, 0 已提交
-- ============================================================

-- ============================================================
-- 1. 系统部门
-- ============================================================
INSERT INTO sys_department (name, code, is_active, created_at, updated_at) VALUES
(N'生产部',    'PROD',  1, GETDATE(), GETDATE()),
(N'品质部',    'QA',    1, GETDATE(), GETDATE()),
(N'仓储部',    'WH',    1, GETDATE(), GETDATE()),
(N'管理部',    'ADMIN', 1, GETDATE(), GETDATE());

-- ============================================================
-- 2. 系统用户 (密码: admin123, bcrypt 12 rounds)
-- ============================================================
INSERT INTO sys_user (username, password, real_name, role_code, phone, is_active, login_attempts, created_at, updated_at) VALUES
('admin',      '$2b$12$.1e3m1dcl6DwhWFqn9Hc8OaEt0RWsgH0Aeh/A8LJ38wU7pCL9/OzC', N'系统管理员', 4, '13800000001', 1, 0, GETDATE(), GETDATE()),
('operator1',  '$2b$12$.1e3m1dcl6DwhWFqn9Hc8OaEt0RWsgH0Aeh/A8LJ38wU7pCL9/OzC', N'张三',       1, '13800000002', 1, 0, GETDATE(), GETDATE()),
('operator2',  '$2b$12$.1e3m1dcl6DwhWFqn9Hc8OaEt0RWsgH0Aeh/A8LJ38wU7pCL9/OzC', N'李四',       1, '13800000003', 1, 0, GETDATE(), GETDATE()),
('quality1',   '$2b$12$.1e3m1dcl6DwhWFqn9Hc8OaEt0RWsgH0Aeh/A8LJ38wU7pCL9/OzC', N'王五',       2, '13800000004', 1, 0, GETDATE(), GETDATE()),
('warehouse1', '$2b$12$.1e3m1dcl6DwhWFqn9Hc8OaEt0RWsgH0Aeh/A8LJ38wU7pCL9/OzC', N'赵六',       3, '13800000005', 1, 0, GETDATE(), GETDATE());

-- ============================================================
-- 3. 系统设备 (各工序设备 + 分容/分选设备)
-- ============================================================
INSERT INTO sys_equipment (equipment_code, equipment_name, model, department_code, is_active, created_at, updated_at) VALUES
('E001', N'配料机-01',     'PL-2000',  'PROD', 1, GETDATE(), GETDATE()),
('E002', N'涂布机-01',     'TB-1800',  'PROD', 1, GETDATE(), GETDATE()),
('E003', N'辊压机-01',     'GY-1500',  'PROD', 1, GETDATE(), GETDATE()),
('E004', N'分切机-01',     'FQ-1200',  'PROD', 1, GETDATE(), GETDATE()),
('E005', N'制片机-01',     'ZP-800',   'PROD', 1, GETDATE(), GETDATE()),
('E006', N'卷绕机-01',     'JR-600',   'PROD', 1, GETDATE(), GETDATE()),
('E007', N'装配线-01',     'ZP-500',   'PROD', 1, GETDATE(), GETDATE()),
('E008', N'烘烤炉-01',     'HK-400',   'PROD', 1, GETDATE(), GETDATE()),
('E009', N'注液机-01',     'ZY-300',   'PROD', 1, GETDATE(), GETDATE()),
('E010', N'顶封机-01',     'DF-300',   'PROD', 1, GETDATE(), GETDATE()),
('E011', N'化成柜-01',     'HC-200',   'PROD', 1, GETDATE(), GETDATE()),
('E012', N'分容柜-01',     'FR-200',   'PROD', 1, GETDATE(), GETDATE()),
('E013', N'分选机-01',     'FX-100',   'PROD', 1, GETDATE(), GETDATE());

-- ============================================================
-- 4. 批次
-- ============================================================
INSERT INTO [batch] (batch_no, product_model, product_spec, workshop, shift, planned_qty, actual_start_date, status, remarks, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', N'IFP27148100-100Ah', N'3.2V 100Ah', N'装配一车间', N'白班', 5000, '2026-05-01', 3, N'首批试产批次', 1, GETDATE(), 1, GETDATE()),
('BATCH2026050002', N'IFP48173150-200Ah', N'3.2V 200Ah', N'装配一车间', N'夜班', 3000, '2026-05-06', 2, N'第二批量产',    1, GETDATE(), 1, GETDATE());

-- ============================================================
-- 5. 工序记录: 配料 (batching_record)
-- ============================================================
INSERT INTO batching_record (batch_no, record_status, is_draft, positive_material, negative_material, viscosity_record, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, N'NCM-811',    N'人造石墨 SG-18',  N'粘度 4500mPa·s，温度 25.3℃', N'张三', 2, '2026-05-01 08:30:00', 2, '2026-05-01 10:00:00'),
('BATCH2026050002', 1, 1, N'NCM-622',    N'天然石墨 NG-12',  N'粘度 4200mPa·s，温度 24.8℃', N'李四', 3, '2026-05-06 20:00:00', 3, '2026-05-06 21:30:00');

-- ============================================================
-- 6. 工序记录: 涂布 (coating_record)
-- ============================================================
INSERT INTO coating_record (batch_no, record_status, is_draft, equipment_code, coating_speed, coating_thickness_pos, coating_thickness_neg, areal_density_pos, areal_density_neg, coating_temperature, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E002', 3.50, 120.00, 115.00, 18.50, 16.20, 85.00, N'张三', 2, '2026-05-01 10:30:00', 2, '2026-05-01 13:00:00'),
('BATCH2026050002', 1, 1, 'E002', 3.80, 122.00, 116.00, 18.80, 16.50, 86.00, N'李四', 3, '2026-05-06 22:00:00', 3, '2026-05-06 23:30:00');

-- ============================================================
-- 7. 工序记录: 辊压 (roller_pressing_record)
-- ============================================================
INSERT INTO roller_pressing_record (batch_no, record_status, is_draft, equipment_code, roller_pressure, roller_thickness, roller_speed, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E003', 12.50, 140.00, 15.00, N'张三', 2, '2026-05-01 13:30:00', 2, '2026-05-01 15:00:00'),
('BATCH2026050002', 1, 1, 'E003', 13.00, 138.00, 14.50, N'李四', 3, '2026-05-07 00:00:00', 3, '2026-05-07 01:30:00');

-- ============================================================
-- 8. 工序记录: 分切 (slitting_record)
-- ============================================================
INSERT INTO slitting_record (batch_no, record_status, is_draft, equipment_code, electrode_width, electrode_length, slitting_speed, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E004', 65.00, 5200.00, 25.00, N'张三', 2, '2026-05-01 15:30:00', 2, '2026-05-01 17:00:00'),
('BATCH2026050002', 1, 1, 'E004', 68.00, 5100.00, 24.00, N'李四', 3, '2026-05-07 02:00:00', 3, '2026-05-07 03:30:00');

-- ============================================================
-- 9. 工序记录: 制片 (electrode_record)
-- ============================================================
INSERT INTO electrode_record (batch_no, record_status, is_draft, tab_material_spec, electrode_length, tab_welding_pull, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, N'铝极耳 0.2×20mm / 镍极耳 0.2×20mm', N'5200±5mm', N'12.5N', N'张三', 2, '2026-05-02 08:00:00', 2, '2026-05-02 10:00:00'),
('BATCH2026050002', 1, 1, N'铝极耳 0.25×25mm / 镍极耳 0.25×25mm', N'5100±5mm', N'13.0N', N'李四', 3, '2026-05-07 04:00:00', 3, '2026-05-07 06:00:00');

-- ============================================================
-- 10. 工序记录: 卷绕 (winding_record)
-- ============================================================
INSERT INTO winding_record (batch_no, record_status, is_draft, equipment_code, separator_model, winding_speed, winding_tension, core_thickness, core_diameter, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E006', N'PP/PE/PP 三层隔膜 20μm', 1.20, 0.80, 12.50, 30.00, N'张三', 2, '2026-05-02 10:30:00', 2, '2026-05-02 12:30:00'),
('BATCH2026050002', 1, 1, 'E006', N'PP/PE/PP 三层隔膜 20μm', 1.15, 0.85, 13.00, 31.00, N'李四', 3, '2026-05-07 06:30:00', 3, '2026-05-07 08:30:00');

-- ============================================================
-- 11. 工序记录: 装配 (assembly_record)
-- ============================================================
INSERT INTO assembly_record (batch_no, record_status, is_draft, casing_equipment_code, shell_model, bottom_weld_equipment, bottom_weld_params, bottom_weld_pull, groove_record, cap_model, cap_welding_pull, tab_welding_pull, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E007', N'铝壳 27×148×100mm', 'E007', N'焊接功率 800W，速度 50mm/s', 85.00, N'滚槽深度 2.0mm，宽度 1.5mm', N'防爆盖板 27mm', 90.00, 12.00, N'张三', 2, '2026-05-02 13:00:00', 2, '2026-05-02 16:00:00'),
('BATCH2026050002', 1, 1, 'E007', N'铝壳 48×173×150mm', 'E007', N'焊接功率 850W，速度 55mm/s', 88.00, N'滚槽深度 2.2mm，宽度 1.6mm', N'防爆盖板 48mm', 92.00, 13.00, N'李四', 3, '2026-05-07 09:00:00', 3, '2026-05-07 12:00:00');

-- ============================================================
-- 12. 工序记录: 烘烤 (baking_record)
-- ============================================================
INSERT INTO baking_record (batch_no, record_status, is_draft, equipment_code, baking_temperature, baking_duration, vacuum_level, moisture_after_baking, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E008', 85.00, 480, -95.00, 150.00, N'张三', 2, '2026-05-02 16:30:00', 2, '2026-05-03 00:30:00'),
('BATCH2026050002', 1, 1, 'E008', 85.00, 480, -95.00, 160.00, N'李四', 3, '2026-05-07 12:30:00', 3, '2026-05-07 20:30:00');

-- ============================================================
-- 13. 工序记录: 注液 (injection_record)
-- ============================================================
INSERT INTO injection_record (batch_no, record_status, is_draft, equipment_code, electrolyte_model, injection_amount, injection_humidity, injection_temperature, sealing_dimension, cleaning_record, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E009', N'LB-315 电解液 1.0M LiPF6 EC/DMC=1:1', 280.00, 0.50, 25.00, 1.50, N'注液口擦拭干净，无残留', N'张三', 2, '2026-05-03 01:00:00', 2, '2026-05-03 03:00:00'),
('BATCH2026050002', 1, 1, 'E009', N'LB-315 电解液 1.0M LiPF6 EC/DMC=1:1', 285.00, 0.60, 25.00, 1.50, N'注液口擦拭干净，无残留', N'李四', 3, '2026-05-07 21:00:00', 3, '2026-05-07 23:00:00');

-- ============================================================
-- 14. 工序记录: 顶封 (wrapping_record)
-- ============================================================
INSERT INTO wrapping_record (batch_no, record_status, is_draft, equipment_code, film_model, shrink_temperature, appearance_check, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E010', N'PVC 热缩膜 35×150mm', 150.00, 1, N'张三', 2, '2026-05-03 03:30:00', 2, '2026-05-03 05:00:00'),
('BATCH2026050002', 1, 1, 'E010', N'PVC 热缩膜 55×180mm', 155.00, 1, N'李四', 3, '2026-05-07 23:30:00', 3, '2026-05-08 01:00:00');

-- ============================================================
-- 15. 工序记录: 化成 (formation_record)
-- ============================================================
INSERT INTO formation_record (batch_no, record_status, is_draft, equipment_code, charge_discharge_template, formation_temperature, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E011', N'0.1C 恒流充电至 3.65V → 恒压至 0.05C → 0.1C 恒流放电至 2.5V × 3 循环', 45.00, N'张三', 2, '2026-05-03 05:30:00', 2, '2026-05-04 05:30:00'),
('BATCH2026050002', 1, 1, 'E011', N'0.1C 恒流充电至 3.65V → 恒压至 0.05C → 0.1C 恒流放电至 2.5V × 3 循环', 45.00, N'李四', 3, '2026-05-08 01:30:00', 3, '2026-05-09 01:30:00');

-- ============================================================
-- 16. 工序记录: 分容 (grading_record)
-- ============================================================
INSERT INTO grading_record (batch_no, record_status, is_draft, equipment_code, charge_discharge_template, grading_temperature, capacity_grade_standard, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E012', N'0.5C 恒流充电至 3.65V → 恒压至 0.05C → 0.5C 恒流放电至 2.5V', 40.00, N'A级 ≥ 100Ah, B级 ≥ 95Ah, 其余为 C 级', N'张三', 2, '2026-05-04 06:00:00', 2, '2026-05-05 06:00:00'),
('BATCH2026050002', 1, 1, 'E012', N'0.5C 恒流充电至 3.65V → 恒压至 0.05C → 0.5C 恒流放电至 2.5V', 40.00, N'A级 ≥ 200Ah, B级 ≥ 190Ah, 其余为 C 级', N'李四', 3, '2026-05-09 02:00:00', 3, '2026-05-10 02:00:00');

-- ============================================================
-- 17. 工序记录: 分选 (sorting_record)
-- ============================================================
INSERT INTO sorting_record (batch_no, record_status, is_draft, equipment_code, ocv_voltage_range, ir_range, capacity_range, operator_name, created_by, created_at, updated_by, updated_at)
VALUES
('BATCH2026050001', 1, 0, 'E013', N'3.29-3.31V', N'0.8-1.2mΩ', N'100-105Ah', N'张三', 2, '2026-05-05 06:30:00', 2, '2026-05-05 08:00:00'),
('BATCH2026050002', 1, 1, 'E013', N'3.30-3.32V', N'0.7-1.1mΩ', N'200-205Ah', N'李四', 3, '2026-05-10 02:30:00', 3, '2026-05-10 04:00:00');

-- ============================================================
-- 18. 电芯条码 (cell_barcode) — 批次 1 生成 15 个, 批次 2 生成 10 个
-- ============================================================
INSERT INTO cell_barcode (barcode, batch_no, sorting_record_id, voltage, internal_resistance, capacity, grade, import_source, imported_at, created_at)
VALUES
-- 批次 1 (BATCH2026050001) — 15 个电芯, 分选记录 ID=1
('BC2026050001001', 'BATCH2026050001', 1, 3.3010, 0.95,  102.50, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001002', 'BATCH2026050001', 1, 3.3020, 0.88,  103.20, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001003', 'BATCH2026050001', 1, 3.2990, 1.02,  101.80, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001004', 'BATCH2026050001', 1, 3.3005, 0.91,  102.00, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001005', 'BATCH2026050001', 1, 3.2980, 1.05,  100.50, 'B', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001006', 'BATCH2026050001', 1, 3.3015, 0.97,  104.00, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001007', 'BATCH2026050001', 1, 3.3000, 0.85,  103.80, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001008', 'BATCH2026050001', 1, 3.2975, 1.10,   99.80, 'B', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001009', 'BATCH2026050001', 1, 3.3025, 0.93,  102.80, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001010', 'BATCH2026050001', 1, 3.2995, 0.99,  101.20, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001011', 'BATCH2026050001', 1, 3.2985, 1.08,   99.50, 'B', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001012', 'BATCH2026050001', 1, 3.3010, 0.87,  103.50, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001013', 'BATCH2026050001', 1, 3.3005, 0.96,  101.90, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001014', 'BATCH2026050001', 1, 3.2960, 1.15,   98.00, 'C', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
('BC2026050001015', 'BATCH2026050001', 1, 3.3000, 0.94,  102.30, 'A', N'分容柜自动导入', '2026-05-05 08:00:00', GETDATE()),
-- 批次 2 (BATCH2026050002) — 10 个电芯, 分选记录 ID=2
('BC2026050002001', 'BATCH2026050002', 2, 3.3100, 0.85,  203.00, 'A', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE()),
('BC2026050002002', 'BATCH2026050002', 2, 3.3080, 0.90,  202.50, 'A', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE()),
('BC2026050002003', 'BATCH2026050002', 2, 3.3110, 0.82,  204.00, 'A', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE()),
('BC2026050002004', 'BATCH2026050002', 2, 3.3075, 0.95,  201.00, 'A', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE()),
('BC2026050002005', 'BATCH2026050002', 2, 3.3090, 0.88,  202.80, 'A', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE()),
('BC2026050002006', 'BATCH2026050002', 2, 3.3060, 1.02,  199.00, 'B', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE()),
('BC2026050002007', 'BATCH2026050002', 2, 3.3105, 0.86,  203.50, 'A', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE()),
('BC2026050002008', 'BATCH2026050002', 2, 3.3085, 0.92,  201.50, 'A', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE()),
('BC2026050002009', 'BATCH2026050002', 2, 3.3050, 1.05,  197.50, 'B', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE()),
('BC2026050002010', 'BATCH2026050002', 2, 3.3095, 0.89,  202.00, 'A', N'分容柜自动导入', '2026-05-10 04:00:00', GETDATE());

-- ============================================================
-- 19. 质量检验 (quality_check)
-- ============================================================
INSERT INTO quality_check (batch_no, process_type, inspection_result, defect_qty, defect_reason, inspector_name, abnormal_record, created_by, created_at, updated_by, updated_at)
VALUES
-- 批次 1 质检记录
('BATCH2026050001', 'batching',         1, NULL, NULL,                             N'王五', N'',                                               4, '2026-05-01 09:00:00', 4, '2026-05-01 09:00:00'),
('BATCH2026050001', 'coating',          1, NULL, NULL,                             N'王五', N'',                                               4, '2026-05-01 13:30:00', 4, '2026-05-01 13:30:00'),
('BATCH2026050001', 'roller-pressing',  1, NULL, NULL,                             N'王五', N'',                                               4, '2026-05-01 15:30:00', 4, '2026-05-01 15:30:00'),
('BATCH2026050001', 'injection',        2, 5,    N'注液量偏少，个别电芯注液量不足 270g', N'王五', N'注液机喷头轻微堵塞，已清理后恢复正常',             4, '2026-05-03 03:00:00', 4, '2026-05-03 03:00:00'),
('BATCH2026050001', 'wrapping',         1, NULL, NULL,                             N'王五', N'',                                               4, '2026-05-03 05:30:00', 4, '2026-05-03 05:30:00'),
('BATCH2026050001', 'formation',        1, NULL, NULL,                             N'王五', N'',                                               4, '2026-05-04 06:00:00', 4, '2026-05-04 06:00:00'),
('BATCH2026050001', 'grading',          1, NULL, NULL,                             N'王五', N'',                                               4, '2026-05-05 06:30:00', 4, '2026-05-05 06:30:00'),
-- 批次 2 质检记录
('BATCH2026050002', 'batching',         1, NULL, NULL,                             N'王五', N'',                                               4, '2026-05-06 21:00:00', 4, '2026-05-06 21:00:00'),
('BATCH2026050002', 'coating',          1, NULL, NULL,                             N'王五', N'',                                               4, '2026-05-06 23:00:00', 4, '2026-05-06 23:00:00');

-- ============================================================
-- 20. 材料仓库 (material_warehouse)
-- ============================================================
INSERT INTO material_warehouse (batch_no, material_type, supplier_batch_no, quantity, unit, created_by, created_at, updated_by, updated_at)
VALUES
-- 批次 1 领料记录
('BATCH2026050001', 1, N'PO202604-SUP01', 250.000, 'kg', 5, '2026-04-30 08:00:00', 5, '2026-04-30 08:00:00'),  -- 正极材料
('BATCH2026050001', 2, N'NG202604-SUP02', 180.000, 'kg', 5, '2026-04-30 08:00:00', 5, '2026-04-30 08:00:00'),  -- 负极材料
('BATCH2026050001', 3, N'LB202604-SUP03', 350.000, 'kg', 5, '2026-04-30 08:00:00', 5, '2026-04-30 08:00:00'),  -- 电解液
('BATCH2026050001', 4, N'SEP202604-SUP04', 2.500,  '卷', 5, '2026-04-30 08:00:00', 5, '2026-04-30 08:00:00'),  -- 隔膜(卷)
('BATCH2026050001', 5, N'SHELL202604-SUP05', 5200.000, '个', 5, '2026-04-30 08:00:00', 5, '2026-04-30 08:00:00'),  -- 壳盖(个)
-- 批次 2 领料记录
('BATCH2026050002', 1, N'PO202605-SUP06', 300.000, 'kg', 5, '2026-05-05 08:00:00', 5, '2026-05-05 08:00:00'),
('BATCH2026050002', 2, N'NG202605-SUP07', 220.000, 'kg', 5, '2026-05-05 08:00:00', 5, '2026-05-05 08:00:00'),
('BATCH2026050002', 3, N'LB202605-SUP08', 420.000, 'kg', 5, '2026-05-05 08:00:00', 5, '2026-05-05 08:00:00'),
('BATCH2026050002', 4, N'SEP202605-SUP09', 3.000,  '卷', 5, '2026-05-05 08:00:00', 5, '2026-05-05 08:00:00'),
('BATCH2026050002', 5, N'SHELL202605-SUP10', 3200.000, '个', 5, '2026-05-05 08:00:00', 5, '2026-05-05 08:00:00');

-- ============================================================
-- 21. 批次状态变更日志 (batch_status_log)
-- ============================================================
INSERT INTO batch_status_log (batch_no, from_status, to_status, changed_by, change_reason, created_at)
VALUES
-- 批次 1 状态变更: 1(草稿) → 2(进行中) → 3(已完成)
('BATCH2026050001', 1, 2, 1, N'开始生产',      '2026-05-01 08:30:00'),
('BATCH2026050001', 2, 3, 1, N'所有工序已完成', '2026-05-05 08:00:00'),
-- 批次 2 状态变更: 1(草稿) → 2(进行中)
('BATCH2026050002', 1, 2, 1, N'开始生产',      '2026-05-06 20:00:00');
