const LOCAL_DEVICE_DATE_TIME = /^(\d{4}-\d{2}-\d{2})[ ](\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?$/;

/**
 * Device integrations send local China time without the ISO 8601 separator
 * or timezone. Make that implicit timezone explicit before class-validator
 * runs, while leaving already valid ISO values untouched.
 */
export function normalizeDeviceDateTime(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const match = value.match(LOCAL_DEVICE_DATE_TIME);
  if (!match) return value;

  const fraction = match[3] ? `.${match[3].padEnd(3, '0')}` : '';
  return `${match[1]}T${match[2]}${fraction}+08:00`;
}
