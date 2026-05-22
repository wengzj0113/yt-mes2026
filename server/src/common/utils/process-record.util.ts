export function mergeExtraData(record: any, dto: any, entityFields: string[]) {
  const extraData: Record<string, any> = record.extraData ? JSON.parse(record.extraData) : {};
  const entityFieldSet = new Set(entityFields);

  Object.entries(dto).forEach(([key, value]) => {
    if (entityFieldSet.has(key)) {
      record[key] = value;
    } else if (key !== 'batchNo') {
      extraData[key] = value;
    }
  });

  if (Object.keys(extraData).length > 0) {
    record.extraData = JSON.stringify(extraData);
  }
}
