import { getAdminStats } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Package, Users, ShoppingCart } from "lucide-react";

export default async function AdminPage() {
  const stats = await getAdminStats();

  const cards = [
    { title: "Organisationen", value: stats.orgCount, icon: Building2 },
    { title: "Nutzer", value: stats.userCount, icon: Users },
    { title: "Assets", value: stats.assetCount, icon: Package },
    { title: "Bestellungen", value: stats.orderCount, icon: ShoppingCart },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Plattform-Übersicht</h2>
        <p className="text-sm text-muted-foreground">Alle Daten auf einen Blick.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
