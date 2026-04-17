"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Building2, Package, Link2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setupOrganization, createOnboardingAsset, linkSupplierToAsset } from "@/lib/actions/onboarding";

type OrgType = "OPERATOR" | "SUPPLIER";

type Step = 1 | 2 | 3;

const ASSET_TYPES = [
  { value: "MACHINE", label: "Maschine" },
  { value: "VEHICLE", label: "Fahrzeug" },
  { value: "IT_EQUIPMENT", label: "IT-Gerät" },
  { value: "OFFICE_EQUIPMENT", label: "Bürogerät" },
  { value: "FACILITY", label: "Anlage" },
  { value: "OTHER", label: "Sonstiges" },
];

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step < currentStep
                ? "bg-green-500 text-white"
                : step === currentStep
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {step < currentStep ? <Check className="w-4 h-4" /> : step}
          </div>
          {step < totalSteps && (
            <div className={`h-0.5 w-12 mx-1 ${step < currentStep ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [orgType, setOrgType] = useState<OrgType | "">("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Step 2 state
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetManufacturer, setAssetManufacturer] = useState("");
  const [assetModel, setAssetModel] = useState("");
  const [assetSerial, setAssetSerial] = useState("");
  const [assetLocation, setAssetLocation] = useState("");
  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null);

  // Step 3 state
  const [supplierName, setSupplierName] = useState("");

  async function handleStep1() {
    if (!orgType) {
      setError("Bitte wähle einen Unternehmenstyp aus.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await setupOrganization({
        type: orgType,
        address: address || undefined,
        phone: phone || undefined,
        email: contactEmail || undefined,
        website: website || undefined,
      });
      if (!result.success) {
        setError(result.error || "Fehler beim Speichern.");
        return;
      }
      // Refresh JWT so middleware knows orgType is now set
      await updateSession({ orgType });

      if (orgType === "SUPPLIER") {
        // Skip steps 2 & 3, go to dashboard
        router.push("/dashboard");
        return;
      }
      setStep(2);
    } catch {
      setError("Unerwarteter Fehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2() {
    if (!assetName || !assetType || !assetManufacturer) {
      setError("Bitte fülle mindestens Name, Typ und Hersteller aus.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await createOnboardingAsset({
        name: assetName,
        type: assetType,
        manufacturer: assetManufacturer,
        model: assetModel || undefined,
        serialNumber: assetSerial || undefined,
        location: assetLocation || undefined,
      });
      if (!result.success) {
        setError(result.error || "Fehler beim Anlegen des Assets.");
        return;
      }
      setCreatedAssetId(result.assetId ?? null);
      setStep(3);
    } catch {
      setError("Unerwarteter Fehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2Skip() {
    setStep(3);
  }

  async function handleStep3(skipSupplier = false) {
    setError(null);
    if (!skipSupplier && supplierName && createdAssetId) {
      setLoading(true);
      try {
        const result = await linkSupplierToAsset({ assetId: createdAssetId, supplierName });
        if (!result.success) {
          setError(result.error || "Fehler beim Verknüpfen.");
          return;
        }
      } catch {
        setError("Unerwarteter Fehler. Bitte erneut versuchen.");
        return;
      } finally {
        setLoading(false);
      }
    }
    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={step} totalSteps={3} />

      {/* Step 1: Organisation einrichten */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Schritt 1: Organisation einrichten</CardTitle>
                <CardDescription>Wie beschreibt euer Unternehmen am besten?</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label>Unternehmenstyp *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrgType("OPERATOR")}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    orgType === "OPERATOR"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">Betreiber</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Wir besitzen und betreiben Geräte/Maschinen
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setOrgType("SUPPLIER")}
                  className={`rounded-lg border-2 p-4 text-left transition-colors ${
                    orgType === "SUPPLIER"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">Hersteller / Dienstleister</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Wir sind Hersteller oder Dienstleister
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm text-gray-500">Optionale Kontaktdaten</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    placeholder="Musterstraße 1, 20097 Hamburg"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    placeholder="+49 40 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactEmail">E-Mail</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="info@unternehmen.de"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://unternehmen.de"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleStep1} disabled={loading}>
                {loading ? "Wird gespeichert..." : "Weiter"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Erstes Asset anlegen */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Schritt 2: Erstes Asset anlegen</CardTitle>
                <CardDescription>Lege dein erstes Gerät oder deine erste Maschine an.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="assetName">Name *</Label>
                <Input
                  id="assetName"
                  placeholder="z.B. Kaffeemaschine Eingang"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="assetType">Typ *</Label>
                <Select value={assetType} onValueChange={(v) => setAssetType(v ?? "")}>
                  <SelectTrigger id="assetType" className="w-full">
                    <SelectValue placeholder="Typ auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="assetManufacturer">Hersteller *</Label>
                <Input
                  id="assetManufacturer"
                  placeholder="z.B. Tchibo"
                  value={assetManufacturer}
                  onChange={(e) => setAssetManufacturer(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="assetModel">Modell</Label>
                <Input
                  id="assetModel"
                  placeholder="z.B. Cafissimo Pure"
                  value={assetModel}
                  onChange={(e) => setAssetModel(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="assetSerial">Seriennummer</Label>
                <Input
                  id="assetSerial"
                  placeholder="z.B. SN-2024-0042"
                  value={assetSerial}
                  onChange={(e) => setAssetSerial(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="assetLocation">Standort</Label>
                <Input
                  id="assetLocation"
                  placeholder="z.B. Halle B, Eingang"
                  value={assetLocation}
                  onChange={(e) => setAssetLocation(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                <ChevronLeft className="w-4 h-4" /> Zurück
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleStep2Skip} disabled={loading}>
                  Überspringen
                </Button>
                <Button onClick={handleStep2} disabled={loading}>
                  {loading ? "Wird erstellt..." : "Weiter"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Hersteller verknüpfen */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Schritt 3: Hersteller verknüpfen</CardTitle>
                <CardDescription>
                  Wer betreut dieses Asset? Lade einen Hersteller ein oder verknüpfe einen bestehenden.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {createdAssetId ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="supplierName">Name des Herstellers / Dienstleisters</Label>
                  <Input
                    id="supplierName"
                    placeholder="z.B. Tchibo GmbH"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Erstellt einen Platzhalter-Eintrag, der später vom Hersteller übernommen werden kann.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
                Kein Asset in Schritt 2 angelegt. Du kannst Hersteller später in den Asset-Details verknüpfen.
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                <ChevronLeft className="w-4 h-4" /> Zurück
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleStep3(true)} disabled={loading}>
                  Später einrichten
                </Button>
                {createdAssetId && supplierName && (
                  <Button onClick={() => handleStep3(false)} disabled={loading}>
                    {loading ? "Wird verknüpft..." : "Setup abschließen"}
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                {(!createdAssetId || !supplierName) && (
                  <Button onClick={() => handleStep3(true)} disabled={loading}>
                    Setup abschließen
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
