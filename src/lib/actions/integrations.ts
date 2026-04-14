"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { adapterRegistry } from "@/lib/integrations/registry";
import { logActivity } from "@/lib/actions/activity";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const SupplierConfigSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  adapterId: z.string().min(1, "Adapter ist erforderlich"),
  isActive: z.boolean().default(true),
  config: z.record(z.string(), z.string()).default({}),
});

const UpdateSupplierConfigSchema = SupplierConfigSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireOrg() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }
  return session.user.organizationId;
}

function safeConfig(raw: unknown): Record<string, unknown> {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Supplier config actions
// ---------------------------------------------------------------------------

export async function getSupplierConfigs() {
  try {
    const organizationId = await requireOrg();
    const configs = await db.supplierConfig.findMany({
      where: { organizationId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: configs };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fehler beim Laden",
    };
  }
}

export async function getSupplierConfig(id: string) {
  try {
    const organizationId = await requireOrg();
    const config = await db.supplierConfig.findFirst({
      where: { id, organizationId },
    });
    if (!config) {
      return { success: false, error: "Konfiguration nicht gefunden" };
    }
    return { success: true, data: config };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fehler beim Laden",
    };
  }
}

export async function createSupplierConfig(data: unknown) {
  try {
    const organizationId = await requireOrg();
    const validated = SupplierConfigSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: "Ungültige Eingabe",
        details: validated.error.flatten(),
      };
    }

    const config = await db.supplierConfig.create({
      data: {
        name: validated.data.name,
        adapterId: validated.data.adapterId,
        config: validated.data.config,
        isActive: validated.data.isActive,
        organizationId,
      },
    });

    revalidatePath("/settings/integrations");
    return { success: true, data: config };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fehler beim Erstellen",
    };
  }
}

export async function updateSupplierConfig(id: string, data: unknown) {
  try {
    const organizationId = await requireOrg();

    const existing = await db.supplierConfig.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      return { success: false, error: "Konfiguration nicht gefunden" };
    }

    const validated = UpdateSupplierConfigSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: "Ungültige Eingabe",
        details: validated.error.flatten(),
      };
    }

    const updated = await db.supplierConfig.update({
      where: { id },
      data: {
        ...(validated.data.name !== undefined && { name: validated.data.name }),
        ...(validated.data.adapterId !== undefined && {
          adapterId: validated.data.adapterId,
        }),
        ...(validated.data.config !== undefined && {
          config: validated.data.config,
        }),
        ...(validated.data.isActive !== undefined && {
          isActive: validated.data.isActive,
        }),
      },
    });

    revalidatePath("/settings/integrations");
    revalidatePath(`/settings/integrations/${id}/edit`);
    return { success: true, data: updated };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Fehler beim Aktualisieren",
    };
  }
}

export async function deleteSupplierConfig(id: string) {
  try {
    const organizationId = await requireOrg();

    const config = await db.supplierConfig.findFirst({
      where: { id, organizationId },
      include: {
        submissions: {
          where: { status: { in: ["PENDING", "SUBMITTED"] } },
          take: 1,
        },
      },
    });

    if (!config) {
      return { success: false, error: "Konfiguration nicht gefunden" };
    }

    if (config.submissions.length > 0) {
      return {
        success: false,
        error:
          "Konfiguration kann nicht gelöscht werden – es gibt noch aktive Übermittlungen.",
      };
    }

    await db.supplierConfig.delete({ where: { id } });

    revalidatePath("/settings/integrations");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fehler beim Löschen",
    };
  }
}

export async function testSupplierConnection(id: string) {
  try {
    const organizationId = await requireOrg();

    const config = await db.supplierConfig.findFirst({
      where: { id, organizationId },
    });
    if (!config) {
      return { success: false, error: "Konfiguration nicht gefunden" };
    }

    const adapter = adapterRegistry.createConfiguredAdapter(
      config.adapterId,
      safeConfig(config.config)
    );
    if (!adapter) {
      return { success: false, error: `Unbekannter Adapter: ${config.adapterId}` };
    }

    const result = await adapter.testConnection();
    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verbindungstest fehlgeschlagen",
    };
  }
}

// ---------------------------------------------------------------------------
// Order submission actions
// ---------------------------------------------------------------------------

export async function submitOrderToSupplier(
  orderId: string,
  supplierConfigId: string
) {
  try {
    const organizationId = await requireOrg();

    const order = await db.order.findFirst({
      where: { id: orderId, organizationId },
      include: {
        asset: { select: { id: true, name: true } },
        items: true,
      },
    });
    if (!order) {
      return { success: false, error: "Bestellung nicht gefunden" };
    }

    const supplierConfig = await db.supplierConfig.findFirst({
      where: { id: supplierConfigId, organizationId, isActive: true },
    });
    if (!supplierConfig) {
      return { success: false, error: "Supplier-Konfiguration nicht gefunden" };
    }

    const adapter = adapterRegistry.createConfiguredAdapter(
      supplierConfig.adapterId,
      safeConfig(supplierConfig.config)
    );
    if (!adapter) {
      return {
        success: false,
        error: `Unbekannter Adapter: ${supplierConfig.adapterId}`,
      };
    }

    const result = await adapter.submitOrder(order);

    const submission = await db.orderSubmission.create({
      data: {
        orderId,
        supplierConfigId,
        externalOrderId: result.externalOrderId,
        status: result.success ? "SUBMITTED" : "FAILED",
        errorMessage: result.errors?.join(", "),
        responseData: JSON.parse(JSON.stringify(result)),
      },
    });

    if (result.success) {
      await db.order.update({
        where: { id: orderId },
        data: { status: "SUBMITTED" },
      });
    }

    try {
      if (result.success) {
        await logActivity(
          "ORDER_SUBMITTED",
          "OrderSubmission",
          submission.id,
          `Order ${order.orderNumber} was submitted to supplier "${supplierConfig.name}".`,
          {
            orderId: order.id,
            supplierConfigId: supplierConfig.id,
          }
        );
      } else {
        await logActivity(
          "ORDER_SUBMISSION_FAILED",
          "OrderSubmission",
          submission.id,
          `Order ${order.orderNumber} submission to supplier "${supplierConfig.name}" failed.`,
          {
            orderId: order.id,
            supplierConfigId: supplierConfig.id,
            error: result.errors?.join(", ") ?? "Unknown error",
          }
        );
      }
    } catch (error) {
      console.error("Activity log failed:", error);
    }

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return { success: result.success, data: submission, message: result.message, errors: result.errors };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Fehler beim Übermitteln",
    };
  }
}

export async function refreshOrderStatus(submissionId: string) {
  try {
    const organizationId = await requireOrg();

    const submission = await db.orderSubmission.findFirst({
      where: {
        id: submissionId,
        order: { organizationId },
      },
      include: { supplierConfig: true, order: true },
    });

    if (!submission) {
      return { success: false, error: "Übermittlung nicht gefunden" };
    }

    if (!submission.externalOrderId) {
      return {
        success: false,
        error: "Keine externe Bestell-ID – Status kann nicht abgefragt werden",
      };
    }

    const adapter = adapterRegistry.createConfiguredAdapter(
      submission.supplierConfig.adapterId,
      safeConfig(submission.supplierConfig.config)
    );
    if (!adapter) {
      return {
        success: false,
        error: `Unbekannter Adapter: ${submission.supplierConfig.adapterId}`,
      };
    }

    const statusResult = await adapter.getOrderStatus(
      submission.externalOrderId
    );

    const updated = await db.orderSubmission.update({
      where: { id: submissionId },
      data: {
        status: statusResult.status,
        lastStatusCheck: new Date(),
        responseData: JSON.parse(JSON.stringify(statusResult)),
      },
    });

    revalidatePath(`/orders/${submission.orderId}`);
    return { success: true, data: updated, status: statusResult };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fehler beim Abrufen des Status",
    };
  }
}

export async function getOrderSubmissions(orderId: string) {
  try {
    const organizationId = await requireOrg();

    const order = await db.order.findFirst({
      where: { id: orderId, organizationId },
    });
    if (!order) {
      return { success: false, error: "Bestellung nicht gefunden" };
    }

    const submissions = await db.orderSubmission.findMany({
      where: { orderId },
      include: {
        supplierConfig: { select: { id: true, name: true, adapterId: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    return { success: true, data: submissions };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Fehler beim Laden",
    };
  }
}
