"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "MANUAL", label: "Handbuch" },
  { value: "SCHEMATIC", label: "Schaltplan" },
  { value: "MAINTENANCE_REPORT", label: "Wartungsbericht" },
  { value: "WARRANTY", label: "Garantie" },
  { value: "INVOICE", label: "Rechnung" },
  { value: "CERTIFICATE", label: "Zertifikat" },
  { value: "OTHER", label: "Sonstiges" },
];

export function DocumentUploadDialog({ assetId }: { assetId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.file || !formData.category || !formData.name) {
      toast.error("Bitte alle Felder ausfüllen");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("file", formData.file);
    data.append("name", formData.name);
    data.append("category", formData.category);
    data.append("assetId", assetId);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload fehlgeschlagen");
      }

      toast.success("Dokument erfolgreich hochgeladen");
      setIsOpen(false);
      setFormData({ name: "", category: "", file: null });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <FileUp className="w-4 h-4" /> Dokument hochladen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokument hochladen</DialogTitle>
          <DialogDescription>
            Fügen Sie ein Dokument zu diesem Asset hinzu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="z.B. Bedienungsanleitung V1"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Datei</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Max. 20MB. PDF, PNG, JPG, DOC, XLS.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Hochladen...
                </>
              ) : (
                "Hochladen"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
