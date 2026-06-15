import "server-only";

import type { Order, OrderStatus } from "./types";
import { generateOrderId, readCollection, updateCollection } from "./db";

const COLLECTION = "orders";

export async function listOrders(): Promise<Order[]> {
  const orders = await readCollection<Order[]>(COLLECTION, []);
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const orders = await readCollection<Order[]>(COLLECTION, []);
  return orders.find((o) => o.id.toUpperCase() === id.toUpperCase());
}

export async function createOrder(
  data: Omit<Order, "id" | "createdAt" | "timeline" | "status"> & { status?: OrderStatus }
): Promise<Order> {
  const order: Order = {
    ...data,
    id: generateOrderId(),
    status: data.status ?? "new",
    createdAt: new Date().toISOString(),
    timeline: [
      { status: "new", label: "Order placed", at: new Date().toISOString() },
    ],
  };
  await updateCollection<Order[]>(COLLECTION, [], (orders) => [...orders, order]);
  return order;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Order placed",
  confirmed: "Order confirmed",
  in_production: "In production at our Delhi workshop",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "paymentStatus" | "razorpayPaymentId">>
): Promise<Order | undefined> {
  let updated: Order | undefined;
  await updateCollection<Order[]>(COLLECTION, [], (orders) =>
    orders.map((o) => {
      if (o.id.toUpperCase() !== id.toUpperCase()) return o;
      updated = { ...o, ...patch };
      if (patch.status && patch.status !== o.status) {
        updated.timeline = [
          ...o.timeline,
          { status: patch.status, label: STATUS_LABELS[patch.status], at: new Date().toISOString() },
        ];
      }
      if (patch.paymentStatus === "paid" && o.paymentStatus !== "paid") {
        updated.timeline = [
          ...(updated.timeline ?? o.timeline),
          { status: "payment", label: "Payment received", at: new Date().toISOString() },
        ];
      }
      return updated;
    })
  );
  return updated;
}
