"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAssets } from "@/lib/actions/assets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

type AssetRow = {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  serialNumber: string | null;
  status: string;
};

export default function AssetsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState(() => {
    const statusFromUrl = searchParams.get("status");
    return statusFromUrl === "GREEN" || statusFromUrl === "YELLOW" || statusFromUrl === "RED"
      ? statusFromUrl
      : "ALL";
  });

  useEffect(() => {
    const statusFromUrl = searchParams.get("status");
    const nextStatus =
      statusFromUrl === "GREEN" || statusFromUrl === "YELLOW" || statusFromUrl === "RED"
        ? statusFromUrl
        : "ALL";
    setStatusFilter(nextStatus);
  }, [searchParams]);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await getAssets();
        if (res.success && res.data) {
          setAssets(res.data);
        } else {
          setFetchError("Datenbankverbindung fehlgeschlagen");
        }
      } catch {
        setFetchError("Datenbankverbindung fehlgeschlagen");
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) || 
                          asset.serialNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || asset.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || asset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "GREEN": return "bg-green-500";
      case "YELLOW": return "bg-yellow-500";
      case "RED": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) return <div className="p-8 text-center">Loading assets...</div>;

  if (fetchError) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Assets</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800 font-medium">Verbindung fehlgeschlagen</p>
          <p className="text-red-600 text-sm mt-2">Stelle sicher, dass die Datenbank läuft.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Assets</h1>
        <Button render={<Link href="/assets/new" />}>
          <Plus className="w-4 h-4" /> New Asset
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            placeholder="Search assets..." 
            className="pl-9" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="MACHINE">Machine</SelectItem>
            <SelectItem value="VEHICLE">Vehicle</SelectItem>
            <SelectItem value="IT_EQUIPMENT">IT Equipment</SelectItem>
            <SelectItem value="OFFICE_EQUIPMENT">Office Equipment</SelectItem>
            <SelectItem value="FACILITY">Facility</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            const selected = v ?? "ALL";
            setStatusFilter(selected);

            const params = new URLSearchParams(searchParams.toString());
            if (selected === "ALL") {
              params.delete("status");
            } else {
              params.set("status", selected);
            }
            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="GREEN">Green</SelectItem>
            <SelectItem value="YELLOW">Yellow</SelectItem>
            <SelectItem value="RED">Red</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-white dark:bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                  No assets found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(asset.status)}`} />
                      <span className="text-xs font-medium">{asset.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell><Badge variant="outline">{asset.type}</Badge></TableCell>
                  <TableCell>{asset.manufacturer}</TableCell>
                  <TableCell>{asset.serialNumber || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button render={<Link href={`/assets/${asset.id}`} />} variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
