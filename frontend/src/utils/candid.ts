export function getOptionalValue<T>(
  val: T | T[] | null | undefined,
): T | undefined {
  if (Array.isArray(val)) {
    return val.length > 0 ? val[0] : undefined;
  }
  if (val !== null && val !== undefined) {
    return val;
  }
  return undefined;
}

export function getOptionalNumber(
  val: bigint | bigint[] | null | undefined,
  defaultVal = 0,
): number {
  const v = getOptionalValue(val);
  return v !== undefined ? Number(v) : defaultVal;
}
