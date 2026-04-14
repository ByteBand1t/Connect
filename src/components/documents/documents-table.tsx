"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Document {
  id: string;
  name: string;
  fileSize: number;
  category: string;
  createdAt: Date;
  assetId: string;
  asset?: { name: string };
  uploadedBy?: { name: string };
}

interface DocumentsTableProps {
  documents: Document[];
}

export default function DocumentsTable({ documents }: DocumentsTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = Array.from(new Set(documents.map((d) => d.category))).filter(Boolean);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                          doc.asset?.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Dokumente oder Assets suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Größe</TableHead>
              <TableHead>Hochgeladen am</TableHead>
              <TableHead>Hochgeladen von</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>
                    <Link 
                      href={`/assets/${doc.assetId}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {doc.asset?.name || "Unbekannt"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{doc.category || "Keine"}</Badge>
                  </TableCell>
                  <TableCell>{formatSize(doc.fileSize)}</TableCell>
                  <TableCell>
                    {format(new Date(doc.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                  </TableCell>
                  <TableCell>{doc.uploadedBy?.name || "System"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  Keine Dokumente gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
