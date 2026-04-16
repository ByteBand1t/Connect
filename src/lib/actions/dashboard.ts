"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ASSET_STATUSES = ["GREEN", "YELLOW", "RED"] as const;
const ORDER_STATUSES = ["DRAFT", "SUBMITTED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  const organizationId = session.user.organizationId;

  const [
    organization,
    assetStatusGroups,
    totalAssets,
    upcomingMaintenance,
    orderStatusGroups,
    recentOrders,
    activeIntegrations,
    openSubmissions,
    failedSubmissions,
    recentActivities,
  ] = await Promise.all([
    db.organization.findUnique({
      where: { id: organizationId },
      select: { type: true, name: true },
    }),
    db.asset.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { status: true },
    }),
    db.asset.count({ where: { organizationId } }),
    db.asset.findMany({
      where: {
        organizationId,
        nextMaintenanceDate: { not: null },
        status: { in: ["YELLOW", "RED"] },
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        nextMaintenanceDate: true,
      },
      orderBy: { nextMaintenanceDate: "asc" },
      take: 10,
    }),
    db.order.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { status: true },
    }),
    db.order.findMany({
      where: { organizationId },
      include: {
        asset: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.supplierConfig.count({ where: { organizationId, isActive: true } }),
    db.orderSubmission.count({
      where: {
        status: { in: ["PENDING", "SUBMITTED"] },
        order: { organizationId },
      },
    }),
    db.orderSubmission.count({
      where: {
        status: "FAILED",
        order: { organizationId },
      },
    }),
    db.activityLog.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const assetCounts = ASSET_STATUSES.reduce<Record<(typeof ASSET_STATUSES)[number], number>>(
    (acc, status) => {
      acc[status] =
        assetStatusGroups.find(
          (group: { status: string; _count: { status: number } }) => group.status === status
        )?._count.status ?? 0;
      return acc;
    },
    { GREEN: 0, YELLOW: 0, RED: 0 }
  );

  const orderCounts = ORDER_STATUSES.reduce<Record<(typeof ORDER_STATUSES)[number], number>>(
    (acc, status) => {
      acc[status] =
        orderStatusGroups.find(
          (group: { status: string; _count: { status: number } }) => group.status === status
        )?._count.status ?? 0;
      return acc;
    },
    { DRAFT: 0, SUBMITTED: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 }
  );

  // Supplier-specific data — only fetched when org is a SUPPLIER
  const [incomingOrders, managedAssets] =
    organization?.type === "SUPPLIER"
      ? await Promise.all([
          db.order.findMany({
            where: { supplierId: organizationId },
            include: {
              asset: { select: { id: true, name: true } },
              organization: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
          db.assetSupplier.findMany({
            where: { supplierId: organizationId },
            include: {
              asset: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  type: true,
                  organization: { select: { name: true } },
                },
              },
            },
            take: 10,
          }),
        ])
      : ([] as const[]);

  return {
    orgType: organization?.type ?? null,
    orgName: organization?.name ?? "",
    assetCounts,
    totalAssets,
    upcomingMaintenance,
    orderCounts,
    recentOrders,
    activeIntegrations,
    openSubmissions,
    failedSubmissions,
    recentActivities,
    incomingOrders: incomingOrders ?? [],
    managedAssets: managedAssets ?? [],
    nowTimestamp: Date.now(),
  };
}
