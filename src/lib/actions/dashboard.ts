"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateAssetStatus } from "@/lib/asset-utils";

type StatusAsset = Parameters<typeof calculateAssetStatus>[0];

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;

  const assets = await db.asset.findMany({
    where: { organizationId },
  });

  const stats = {
    green: assets.filter((a: StatusAsset) => calculateAssetStatus(a) === "GREEN").length,
    yellow: assets.filter((a: StatusAsset) => calculateAssetStatus(a) === "YELLOW").length,
    red: assets.filter((a: StatusAsset) => calculateAssetStatus(a) === "RED").length,
    total: assets.length,
  };

  const recentAssets = await db.asset.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const activeIntegrations = await db.supplierConfig.count({
    where: { organizationId, isActive: true },
  });

  const pendingSubmissions = await db.orderSubmission.count({
    where: {
      order: { organizationId },
      status: { in: ["PENDING", "SUBMITTED"] },
    },
  });

  return { stats, recentAssets, activeIntegrations, pendingSubmissions };
}
