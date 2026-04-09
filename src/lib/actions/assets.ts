"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const AssetSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(["MACHINE", "VEHICLE", "IT_EQUIPMENT", "OFFICE_EQUIPMENT", "FACILITY", "OTHER"]),
  manufacturer: z.string().min(2, "Manufacturer is required"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["GREEN", "YELLOW", "RED"]).default("GREEN"),
  purchaseDate: z.coerce.date().optional(),
  warrantyUntil: z.coerce.date().optional(),
  maintenanceIntervalDays: z.coerce.number().int().positive().optional(),
  lastMaintenanceDate: z.coerce.date().optional(),
  nextMaintenanceDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export async function getAssets() {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  return await db.asset.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAsset(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  const asset = await db.asset.findUnique({
    where: { id },
  });

  if (!asset || asset.organizationId !== session.user.organizationId) {
    throw new Error("Asset not found or unauthorized");
  }

  return asset;
}

export async function createAsset(data: any) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  const validated = AssetSchema.safeParse(data);
  if (!validated.success) return { success: false, error: "Invalid input" };

  try {
    await db.asset.create({
      data: {
        ...validated.data,
        organizationId: session.user.organizationId,
      },
    });
    revalidatePath("/assets");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Could not create asset" };
  }
}

export async function updateAsset(id: string, data: any) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  const asset = await getAsset(id); // Re-uses Org check
  const validated = AssetSchema.partial().safeParse(data);
  if (!validated.success) return { success: false, error: "Invalid input" };

  try {
    await db.asset.update({
      where: { id },
      data: validated.data,
    });
    revalidatePath("/assets");
    revalidatePath(`/assets/${id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: "Could not update asset" };
  }
}

export async function deleteAsset(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  const asset = await getAsset(id); // Re-uses Org check

  try {
    await db.asset.delete({
      where: { id },
    });
    revalidatePath("/assets");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Could not delete asset" };
  }
}
