"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type ActivityType =
  | "ASSET_CREATED"
  | "ASSET_UPDATED"
  | "ASSET_DELETED"
  | "ASSET_STATUS_CHANGED"
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "ORDER_SUBMITTED"
  | "ORDER_DELIVERED"
  | "ORDER_DELETED"
  | "ORDER_SUBMISSION_FAILED";

export async function logActivity(
  type: ActivityType,
  entityType: "Asset" | "Order" | "OrderSubmission",
  entityId: string,
  description: string,
  metadata?: Record<string, string | number | boolean | null>
) {
  const session = await auth();

  if (!session?.user?.organizationId || !session.user.id) {
    throw new Error("Unauthorized");
  }

  return db.activityLog.create({
    data: {
      type,
      entityType,
      entityId,
      description,
      metadata,
      userId: session.user.id,
      organizationId: session.user.organizationId,
    },
  });
}

export async function getRecentActivities(limit = 10) {
  const session = await auth();

  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  return db.activityLog.findMany({
    where: {
      organizationId: session.user.organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
