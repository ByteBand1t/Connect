"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const OrderItemSchema = z.object({
  partNumber: z.string().min(1, "Part number is required"),
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().min(0).optional(),
});

const CreateOrderSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  notes: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, "At least one item is required"),
});

export async function getOrders() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) throw new Error("Unauthorized");

    const orders = await db.order.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        asset: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: orders };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch orders" };
  }
}

export async function getOrder(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  const order = await db.order.findUnique({
    where: { id },
    include: {
      asset: true,
      createdBy: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  if (!order || order.organizationId !== session.user.organizationId) {
    throw new Error("Order not found or unauthorized");
  }

  return order;
}

export async function createOrder(data: any) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");
  if (!session?.user?.id) throw new Error("User not found");

  const validated = CreateOrderSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.flatten().fieldErrors };
  }

  try {
    // Calculate total amount from items
    const totalAmount = validated.data.items.reduce((sum, item) => {
      const itemTotal = item.quantity * (item.unitPrice || 0);
      return sum + itemTotal;
    }, 0);

    const order = await db.order.create({
      data: {
        assetId: validated.data.assetId,
        notes: validated.data.notes,
        totalAmount,
        currency: "EUR",
        createdById: session.user.id,
        organizationId: session.user.organizationId,
        items: {
          create: validated.data.items.map((item) => ({
            ...item,
            totalPrice: item.quantity * (item.unitPrice || 0),
          })),
        },
      },
    });

    revalidatePath("/orders");
    return { success: true, data: order };
  } catch (e) {
    console.error("Create order error:", e);
    return { success: false, error: "Could not create order" };
  }
}

export async function updateOrderStatus(id: string, status: any) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.organizationId !== session.user.organizationId) {
    throw new Error("Order not found or unauthorized");
  }

  const validStatuses = ["DRAFT", "SUBMITTED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  try {
    await db.order.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: "Could not update order status" };
  }
}

export async function deleteOrder(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) throw new Error("Unauthorized");

  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.organizationId !== session.user.organizationId) {
    throw new Error("Order not found or unauthorized");
  }

  if (order.status !== "DRAFT") {
    return { success: false, error: "Only draft orders can be deleted" };
  }

  try {
    await db.order.delete({
      where: { id },
    });
    revalidatePath("/orders");
    return { success: true };
  } catch (e) {
    return { success: false, error: "Could not delete order" };
  }
}