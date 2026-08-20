import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "D:/traecode/YT-mes/doc/云通MES系统  工序控制参数列表260813.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 12000,
  tableMaxRows: 12,
  tableMaxCols: 20,
  tableMaxCellChars: 120,
});
console.log(summary.ndjson);

const sheets = workbook.worksheets.items;
for (const sheet of sheets) {
  const used = sheet.getUsedRange();
  console.log(`--- SHEET ${sheet.name} USED ${used?.address ?? "none"} ---`);
  if (used) {
    const region = await workbook.inspect({
      kind: "region",
      sheetId: sheet.name,
      range: used.address,
      maxChars: 16000,
    });
    console.log(region.ndjson);
  }
}
