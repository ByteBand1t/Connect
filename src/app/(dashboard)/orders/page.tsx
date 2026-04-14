import Link from "next/link";
import { getOrders } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "./orders-table";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  DRAFT: "Entwurf",
  SUBMITTED: "Eingereicht",
  CONFIRMED: "Bestätigt",
  SHIPPED: "Versendet",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
};

export default async function OrdersPage() {
  const { data: orders, success } = await getOrders();

  if (!success || !orders) {
    return <div className="p-8 text-red-500">Fehler beim Laden der Bestellungen</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bestellungen</h1>
        <Button render={<Link href="/orders/new" />}>
          Neue Bestellung
        </Button>
      </div>

      <OrdersTable orders={orders} statusLabels={statusLabels} />
    </div>
  );
}