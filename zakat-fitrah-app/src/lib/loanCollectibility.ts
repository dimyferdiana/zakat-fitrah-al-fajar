export interface CollectibilityRange { label: string; min: number; max: number | null }
export interface CollectibilityConfig { enabled: boolean; version: number | null; ranges: CollectibilityRange[] | null }

/** Classification is always derived from DPD; disabled or invalid inputs have no label. */
export function classifyCollectibility(dpd: number | null, config: CollectibilityConfig | null | undefined): string | null {
  if (!config?.enabled || !config.ranges || dpd === null || !Number.isSafeInteger(dpd) || dpd < 0) return null;
  return config.ranges.find(range => dpd >= range.min && (range.max === null || dpd <= range.max))?.label ?? null;
}
