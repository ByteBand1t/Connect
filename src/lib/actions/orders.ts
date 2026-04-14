"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const OrderItemSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().nonnegative().optional(),
});

const OrderSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  notes: z.string().optional(),
  currency: z.string().default("EUR"),
  items: z.array(OrderItemSchema).min(1, "At least one item is required"),
});

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
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch orders" };
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
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch order" };
  }
}

export async function createOrder(data: unknown) {
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

    const totalAmount = items.reduce((sum, item) => {
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
        ...orderData,
        totalAmount,
        createdById: session.user.id,
        organizationId: session.user.organizationId,
        items: {
          create: items.map((item) => ({
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

    revalidatePath("/orders");
    return { success: true, data: order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create order" };
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

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update order status" };
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

    revalidatePath("/orders");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete order" };
  }
}
