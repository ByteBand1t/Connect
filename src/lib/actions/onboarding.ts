"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function checkOnboardingComplete(): Promise<{ complete: boolean }> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { complete: false };
  }

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { type: true },
  });

  return { complete: org?.type !== null && org?.type !== undefined };
}

const OrgSetupSchema = z.object({
  type: z.enum(["OPERATOR", "SUPPLIER"]),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
});

export async function setupOrganization(data: {
  type: "OPERATOR" | "SUPPLIER";
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const validated = OrgSetupSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: "Ungültige Eingabe" };
  }

  try {
    await db.organization.update({
      where: { id: session.user.organizationId },
      data: {
        type: validated.data.type,
        address: validated.data.address || null,
        phone: validated.data.phone || null,
        email: validated.data.email || null,
        website: validated.data.website || null,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, orgType: validated.data.type };
  } catch {
    return { success: false, error: "Fehler beim Speichern der Organisation" };
  }
}

const OnboardingAssetSchema = z.object({
  name: z.string().min(2, "Name ist erforderlich"),
  type: z.enum(["MACHINE", "VEHICLE", "IT_EQUIPMENT", "OFFICE_EQUIPMENT", "FACILITY", "OTHER"]),
  manufacturer: z.string().min(1, "Hersteller ist erforderlich"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
});

export async function createOnboardingAsset(data: {
  name: string;
  type: string;
  manufacturer: string;
  model?: string;
  serialNumber?: string;
  location?: string;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  const validated = OnboardingAssetSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: "Ungültige Eingabe", details: validated.error.flatten() };
  }

  try {
    const asset = await db.asset.create({
      data: {
        ...validated.data,
        organizationId: session.user.organizationId,
      },
    });

    revalidatePath("/assets");
    return { success: true, assetId: asset.id };
  } catch {
    return { success: false, error: "Fehler beim Anlegen des Assets" };
  }
}

export async function linkSupplierToAsset(data: {
  assetId: string;
  supplierName: string;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Find or create a supplier org (placeholder, claimed later)
    let supplier = await db.organization.findFirst({
      where: { name: data.supplierName, type: "SUPPLIER" },
    });

    if (!supplier) {
      const slug =
        data.supplierName.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "") +
        "-" +
        Math.random().toString(36).slice(2, 7);

      supplier = await db.organization.create({
        data: {
          name: data.supplierName,
          slug,
          type: "SUPPLIER",
        },
      });
    }

    // Verify asset belongs to this org
    const asset = await db.asset.findFirst({
      where: { id: data.assetId, organizationId: session.user.organizationId },
    });

    if (!asset) {
      return { success: false, error: "Asset nicht gefunden" };
    }

    await db.assetSupplier.upsert({
      where: { assetId_supplierId: { assetId: data.assetId, supplierId: supplier.id } },
      create: {
        assetId: data.assetId,
        supplierId: supplier.id,
        isDefault: true,
      },
      update: {},
    });

    return { success: true };
  } catch {
    return { success: false, error: "Fehler beim Verknüpfen des Herstellers" };
  }
}

export async function getAssetSuppliers(assetId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Unauthorized", data: [] };
  }

  try {
    const suppliers = await db.assetSupplier.findMany({
      where: { assetId },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      data: suppliers.map((s) => ({
        id: s.supplierId,
        name: s.supplier.name,
        isDefault: s.isDefault,
      })),
    };
  } catch {
    return { success: false, error: "Fehler beim Laden der Hersteller", data: [] };
  }
}
