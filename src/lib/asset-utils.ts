"use client";

import { Asset, AssetStatus } from "@prisma/client";
import { addDays, isAfter, isBefore, parseISO } from "date-fns";

export function calculateAssetStatus(asset: Asset): AssetStatus {
  if (!asset.nextMaintenanceDate) {
    return AssetStatus.GREEN;
  }

  const nextDate = new Date(asset.nextMaintenanceDate);
  const now = new Date();
  const thirtyDaysFromNow = addDays(now, 30);

  if (isBefore(nextDate, now)) {
    return AssetStatus.RED;
  }

  if (isBefore(nextDate, thirtyDaysFromNow)) {
    return AssetStatus.YELLOW;
  }

  return AssetStatus.GREEN;
}
