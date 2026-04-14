"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { deleteAsset } from "@/lib/actions/assets";

export function DeleteAssetButton({ assetId, assetName }: { assetId: string; assetName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const res = await deleteAsset(assetId);
    if (res.success) {
      router.push("/assets");
      router.refresh();
    } else {
      alert(res.error || "Fehler beim Löschen");
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
        disabled={loading}
      >
        <Trash2 className="w-4 h-4" /> Löschen
      </Button>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Asset löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du <strong>{assetName}</strong> löschen möchtest? Diese Aktion kann nicht rückgängig
              gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Lösche..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
