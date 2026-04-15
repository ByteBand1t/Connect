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
  let orders;
  try {
    const result = await getOrders();
    if (!result.success || !result.data) {
      return (
        <div className="p-6 space-y-4">
          <h1 className="text-3xl font-bold">Bestellungen</h1>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-800 font-medium">Datenbankverbindung fehlgeschlagen</p>
            <p className="text-red-600 text-sm mt-2">Bitte prüfe deine .env Datei und stelle sicher, dass PostgreSQL läuft.</p>
          </div>
        </div>
      );
    }
    orders = result.data;
  } catch (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Bestellungen</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800 font-medium">Datenbankverbindung fehlgeschlagen</p>
          <p className="text-red-600 text-sm mt-2">Bitte prüfe deine .env Datei und stelle sicher, dass PostgreSQL läuft.</p>
        </div>
      </div>
    );
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