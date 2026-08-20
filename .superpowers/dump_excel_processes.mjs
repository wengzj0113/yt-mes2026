import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";
const input = await FileBlob.load("D:/traecode/YT-mes/doc/云通MES系统  工序控制参数列表260813.xlsx");
const wb = await SpreadsheetFile.importXlsx(input);
const sheet = wb.worksheets.getItem("Sheet1");
const values = sheet.getRange("C4:G125").values;
let process = null;
const rows = [];
for (const row of values) {
  const [seq, name, item, format] = row;
  if (seq != null && String(seq).trim() && /^\d+$/.test(String(seq).trim())) process = { seq: Number(seq), name: String(name).trim(), fields: [] };
  if (process && item && !["设备信息", "正极涂布机信息", "负极涂布机信息"].includes(String(item).trim())) process.fields.push({ item: String(item).trim(), format: format == null ? "" : String(format).trim() });
  if (process && !rows.includes(process)) rows.push(process);
}
console.log(JSON.stringify(rows, null, 2));
