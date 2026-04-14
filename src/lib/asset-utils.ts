export type AssetStatus = "GREEN" | "YELLOW" | "RED";
type AssetLike = {
  nextMaintenanceDate: Date | string | null;
};

export function calculateAssetStatus(asset: AssetLike): AssetStatus {
  if (!asset.nextMaintenanceDate) {
    return "GREEN";
  }

  const nextDate = new Date(asset.nextMaintenanceDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (nextDate < now) {
    return "RED";
  }

  if (nextDate < thirtyDaysFromNow) {
    return "YELLOW";
  }

  return "GREEN";
}
