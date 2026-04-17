"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { getAssets } from "@/lib/actions/assets";
import { createOrder } from "@/lib/actions/orders";
import { getAssetSuppliers } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Asset = {
  id: string;
  name: string;
};

type Supplier = {
  id: string;
  name: string;
  isDefault: boolean;
};

type OrderItem = {
  partNumber: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export default function NewOrderPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssets() {
      const res = await getAssets();
      if (res.success && res.data) {
        setAssets(res.data.map((a) => ({ id: a.id, name: a.name })));
      }
    }
    fetchAssets();
  }, []);

  // When asset changes, fetch its linked suppliers
  useEffect(() => {
    if (!selectedAssetId) {
      setSuppliers([]);
      setSelectedSupplierId("");
      return;
    }

    setLoadingSuppliers(true);
    getAssetSuppliers(selectedAssetId)
      .then((res) => {
        if (res.success && res.data) {
          setSuppliers(res.data);
          // Pre-select default supplier if there is one
          const def = res.data.find((s) => s.isDefault);
          setSelectedSupplierId(def?.id ?? "");
        } else {
          setSuppliers([]);
          setSelectedSupplierId("");
        }
      })
      .finally(() => setLoadingSuppliers(false));
  }, [selectedAssetId]);

  function addItem() {
    setItems((prev) => [...prev, { partNumber: "", name: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i !== index ? item : { ...item, [field]: value }))
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedAssetId) {
      setError("Bitte wähle ein Asset aus.");
      return;
    }
    if (items.length === 0) {
      setError("Bitte füge mindestens eine Position hinzu.");
      return;
    }

    setLoading(true);
    try {
      const result = await createOrder({
        assetId: selectedAssetId,
        supplierId: selectedSupplierId || undefined,
        notes,
        currency: "EUR",
        items: items.map((item) => ({
          partNumber: item.partNumber,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      if (result.success) {
        router.push("/orders");
      } else {
        setError(result.error || "Fehler beim Erstellen der Bestellung.");
      }
    } catch {
      setError("Unerwarteter Fehler beim Erstellen der Bestellung.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Neue Bestellung</h1>
        <Button variant="outline" render={<Link href="/orders" />}>
          Abbrechen
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bestelldetails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Asset selection */}
            <div className="space-y-2">
              <Label htmlFor="asset">Asset</Label>
              <Select value={selectedAssetId} onValueChange={(v) => setSelectedAssetId(v ?? "")}>
                <SelectTrigger id="asset" className="w-full">
                  <SelectValue placeholder="Asset auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier selection — shown once an asset is picked */}
            {selectedAssetId && (
              <div className="space-y-2">
                <Label htmlFor="supplier">
                  Hersteller / Lieferant
                  {loadingSuppliers && (
                    <span className="ml-2 text-xs text-muted-foreground">Lädt...</span>
                  )}
                </Label>
                {suppliers.length === 0 && !loadingSuppliers ? (
                  <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">
                    Kein Hersteller mit diesem Asset verknüpft. Du kannst die Bestellung trotzdem
                    aufgeben und später einen Hersteller zuweisen.
                  </p>
                ) : (
                  <Select
                    value={selectedSupplierId}
                    onValueChange={(v) => setSelectedSupplierId(v ?? "")}
                    disabled={loadingSuppliers}
                  >
                    <SelectTrigger id="supplier" className="w-full">
                      <SelectValue placeholder="Hersteller auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                          {s.isDefault ? " (Standard)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Optionale Notizen zur Bestellung..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Positionen</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4" /> Position hinzufügen
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Positionen. Klicke auf &quot;Position hinzufügen&quot;.
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const lineTotal = item.quantity * item.unitPrice;
                  return (
                    <div key={index} className="rounded-md border p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Teilenummer</Label>
                          <Input
                            placeholder="z.B. P-12345"
                            value={item.partNumber}
                            onChange={(e) => updateItem(index, "partNumber", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Name</Label>
                          <Input
                            placeholder="z.B. Hydraulikfilter"
                            value={item.name}
                            onChange={(e) => updateItem(index, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Menge</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Einzelpreis (€)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, "unitPrice", Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Zeilenpreis: <strong>{lineTotal.toFixed(2)} €</strong>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4" /> Entfernen
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {items.length > 0 && (
              <div className="flex justify-end pt-2 border-t">
                <span className="text-sm font-medium">
                  Gesamtbetrag: <strong>{totalAmount.toFixed(2)} €</strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" render={<Link href="/orders" />}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Wird erstellt..." : "Bestellung erstellen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
