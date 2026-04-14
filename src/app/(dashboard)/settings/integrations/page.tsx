import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSupplierConfigs } from "@/lib/actions/integrations";
import { IntegrationsTable } from "./integrations-table";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const { data: configs, success, error } = await getSupplierConfigs();

  if (!success) {
    return (
      <div className="p-8 text-red-500">
        Fehler beim Laden der Integrationen: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrationen</h1>
          <p className="text-muted-foreground mt-1">
            Verwalte externe Hersteller-Schnittstellen und REST-API-Adapter.
          </p>
        </div>
        <Button render={<Link href="/settings/integrations/new" />}>
          <Plus className="w-4 h-4" />
          Neue Integration hinzufügen
        </Button>
      </div>

      <IntegrationsTable configs={configs ?? []} />
    </div>
  );
}
