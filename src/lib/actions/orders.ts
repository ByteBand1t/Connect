"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/actions/activity";

const OrderItemSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().nonnegative().optional(),
});

const OrderSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().default("EUR"),
  items: z.array(OrderItemSchema).min(1, "At least one item is required"),
});
type OrderInput = z.infer<typeof OrderSchema>;

export type OrderStatus = "DRAFT" | "SUBMITTED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export async function getOrders() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const orders = await db.order.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        asset: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const ordersWithNames = orders.map((order) => ({
      ...order,
      assetName: order.asset.name,
      createdByName: order.createdBy.name,
    }));

    return { success: true, data: ordersWithNames };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch orders",
    };
  }
}

export async function getOrder(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const order = await db.order.findUnique({
      where: { id },
      include: {
        asset: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: true,
        organization: { select: { id: true, name: true } },
      },
    });

    if (!order || order.organizationId !== session.user.organizationId) {
      return { success: false, error: "Order not found or unauthorized" };
    }

    return { success: true, data: order };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch order",
    };
  }
}

export async function createOrder(data: OrderInput) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId || !session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = OrderSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: "Invalid input", details: validated.error.flatten() };
    }

    const { items, ...orderData } = validated.data;

    const totalAmount = items.reduce((sum, item: z.infer<typeof OrderItemSchema>) => {
      return sum + item.quantity * (item.unitPrice || 0);
    }, 0);

    // Verify asset belongs to organization
    const asset = await db.asset.findFirst({
      where: { id: orderData.assetId, organizationId: session.user.organizationId },
    });

    if (!asset) {
      return { success: false, error: "Asset not found or unauthorized" };
    }

    const order = await db.order.create({
      data: {
        assetId: orderData.assetId,
        notes: orderData.notes,
        currency: orderData.currency,
        supplierId: orderData.supplierId || null,
        totalAmount,
        createdById: session.user.id,
        organizationId: session.user.organizationId,
        items: {
          create: items.map((item: z.infer<typeof OrderItemSchema>) => ({
            ...item,
            totalPrice: item.quantity * (item.unitPrice || 0),
          })),
        },
      },
      include: {
        items: true,
        asset: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    try {
      await logActivity("ORDER_CREATED", "Order", order.id, `Order ${order.orderNumber} was created.`, {
        assetId: order.assetId,
        status: order.status,
      });
    } catch (error) {
      console.error("Activity log failed:", error);
    }

    revalidatePath("/orders");
    return { success: true, data: order };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create order",
    };
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const validStatuses: OrderStatus[] = ["DRAFT", "SUBMITTED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Invalid status" };
    }

    const order = await db.order.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!order) {
      return { success: false, error: "Order not found or unauthorized" };
    }

    await db.order.update({
      where: { id },
      data: { status },
    });

    try {
      await logActivity(
        status === "DELIVERED" ? "ORDER_DELIVERED" : "ORDER_STATUS_CHANGED",
        "Order",
        id,
        `Order ${order.orderNumber} status changed from ${order.status} to ${status}.`,
        {
          previousStatus: order.status,
          currentStatus: status,
        }
      );
    } catch (error) {
      console.error("Activity log failed:", error);
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update order status",
    };
  }
}

export async function deleteOrder(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const order = await db.order.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!order) {
      return { success: false, error: "Order not found or unauthorized" };
    }

    if (order.status !== "DRAFT") {
      return { success: false, error: "Only draft orders can be deleted" };
    }

    await db.order.delete({ where: { id } });

    try {
      await logActivity("ORDER_DELETED", "Order", id, `Order ${order.orderNumber} was deleted.`, {
        status: order.status,
      });
    } catch (error) {
      console.error("Activity log failed:", error);
    }

    revalidatePath("/orders");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete order",
    };
  }
}
