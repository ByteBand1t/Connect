import { Asset, AssetStatus } from "@prisma/client";

export function calculateAssetStatus(asset: Asset): AssetStatus {
  if (!asset.nextMaintenanceDate) {
    return AssetStatus.GREEN;
  }

  const nextDate = new Date(asset.nextMaintenanceDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (nextDate < now) {
    return AssetStatus.RED;
  }

  if (nextDate < thirtyDaysFromNow) {
    return AssetStatus.YELLOW;
  }

  return AssetStatus.GREEN;
}
