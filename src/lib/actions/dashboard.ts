"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateAssetStatus } from "@/lib/asset-utils";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const assets = await db.asset.findMany({
    where: { organizationId: session.user.organizationId },
  });

  const stats = {
    green: assets.filter(a => calculateAssetStatus(a) === "GREEN").length,
    yellow: assets.filter(a => calculateAssetStatus(a) === "YELLOW").length,
    red: assets.filter(a => calculateAssetStatus(a) === "RED").length,
    total: assets.length,
  };

  const recentAssets = await db.asset.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { stats, recentAssets };
}
