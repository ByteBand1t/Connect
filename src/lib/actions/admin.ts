"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function requireSuperAdmin(email: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || email !== adminEmail) {
    throw new Error("Unauthorized");
  }
}

export async function getAdminStats() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  requireSuperAdmin(session.user.email);

  const [orgCount, userCount, assetCount, orderCount] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.asset.count(),
    db.order.count(),
  ]);

  return { orgCount, userCount, assetCount, orderCount };
}

export async function getAllOrganizations() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  requireSuperAdmin(session.user.email);

  return db.organization.findMany({
    include: {
      _count: { select: { users: true, assets: true, orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllAssets() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  requireSuperAdmin(session.user.email);

  return db.asset.findMany({
    include: {
      organization: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllUsers() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  requireSuperAdmin(session.user.email);

  return db.user.findMany({
    include: {
      organization: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminDeleteOrganization(orgId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  requireSuperAdmin(session.user.email);

  await db.organization.delete({ where: { id: orgId } });
}
