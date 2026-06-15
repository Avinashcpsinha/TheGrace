import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/orders";
import { OrdersClient } from "./OrdersClient";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await requireAdmin())) redirect("/admin/login");
  const [orders, { q }] = await Promise.all([listOrders(), searchParams]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ivory">Orders</h1>
      <p className="mt-1 text-sm text-muted">
        {orders.length} order{orders.length === 1 ? "" : "s"} — newest first. Update a
        status and the customer-facing tracking timeline follows.
      </p>
      <OrdersClient initialOrders={orders} initialQuery={typeof q === "string" ? q : ""} />
    </div>
  );
}
