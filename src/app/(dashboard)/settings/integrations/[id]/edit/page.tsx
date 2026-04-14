"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getSupplierConfig, updateSupplierConfig } from "@/lib/actions/integrations";

const schema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  adapterId: z.enum(["demo", "rest"]),
  isActive: z.boolean(),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  headerName: z.string().optional(),
  submitEndpoint: z.string().optional(),
  statusEndpoint: z.string().optional(),
  httpMethod: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function maskApiKey(key: string): string {
  if (!key || key.length <= 4) return "****";
  return `****${key.slice(-4)}`;
}

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export default function EditIntegrationPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalApiKey, setOriginalApiKey] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      adapterId: "demo",
      isActive: true,
      baseUrl: "",
      apiKey: "",
      headerName: "X-API-Key",
      submitEndpoint: "/orders",
      statusEndpoint: "/orders",
      httpMethod: "POST",
    },
  });

  const adapterId = form.watch("adapterId");

  useEffect(() => {
    async function load() {
      const result = await getSupplierConfig(params.id);
      if (!result.success || !result.data) {
        toast.error("Konfiguration nicht gefunden.");
        router.push("/settings/integrations");
        return;
      }

      const cfg = result.data;
      const raw =
        typeof cfg.config === "object" &&
        cfg.config !== null &&
        !Array.isArray(cfg.config)
          ? (cfg.config as Record<string, unknown>)
          : {};

      const storedKey = safeStr(raw.apiKey);
      setOriginalApiKey(storedKey);

      form.reset({
        name: cfg.name,
        adapterId: cfg.adapterId as "demo" | "rest",
        isActive: cfg.isActive,
        baseUrl: safeStr(raw.baseUrl),
        apiKey: storedKey ? maskApiKey(storedKey) : "",
        headerName: safeStr(raw.headerName) || "X-API-Key",
        submitEndpoint: safeStr(raw.submitEndpoint) || "/orders",
        statusEndpoint: safeStr(raw.statusEndpoint) || "/orders",
        httpMethod: safeStr(raw.httpMethod) || "POST",
      });
      setLoading(false);
    }
    load();
  }, [params.id, form, router]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const config: Record<string, string> = {};
      if (values.adapterId === "rest") {
        if (values.baseUrl) config.baseUrl = values.baseUrl;

        // Only update API key if user changed it (not the masked version)
        const apiKeyValue = values.apiKey ?? "";
        if (apiKeyValue && !apiKeyValue.startsWith("****")) {
          config.apiKey = apiKeyValue;
        } else if (originalApiKey) {
          config.apiKey = originalApiKey;
        }

        if (values.headerName) config.headerName = values.headerName;
        if (values.submitEndpoint)
          config.submitEndpoint = values.submitEndpoint;
        if (values.statusEndpoint)
          config.statusEndpoint = values.statusEndpoint;
        if (values.httpMethod) config.httpMethod = values.httpMethod;
      }

      const result = await updateSupplierConfig(params.id, {
        name: values.name,
        adapterId: values.adapterId,
        isActive: values.isActive,
        config,
      });

      if (result.success) {
        toast.success("Integration erfolgreich aktualisiert.");
        router.push("/settings/integrations");
      } else {
        toast.error(result.error ?? "Fehler beim Aktualisieren.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Lade Konfiguration…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Integration bearbeiten</h1>
        <Button
          variant="outline"
          render={<Link href="/settings/integrations" />}
        >
          Zurück
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konfiguration anpassen</CardTitle>
          <CardDescription>
            Ändere die Parameter dieser Integration. API-Keys werden als ****
            maskiert angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adapterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adapter</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        {...field}
                      >
                        <option value="demo">Demo-Adapter (Testen)</option>
                        <option value="rest">REST-API-Adapter</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Integration aktivieren
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {adapterId === "rest" && (
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-muted-foreground">
                    REST-API Konfiguration
                  </p>

                  <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Basis-URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://api.example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            API-Key{" "}
                            <span className="text-xs text-muted-foreground">
                              (leer lassen = unverändert)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Neuen Key eingeben oder leer lassen"
                              {...field}
                              onFocus={(e) => {
                                // Clear masked value on focus so user can type a new one
                                if (e.target.value.startsWith("****")) {
                                  field.onChange("");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="headerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header-Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="X-API-Key"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="submitEndpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Submit-Endpunkt</FormLabel>
                          <FormControl>
                            <Input placeholder="/orders" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="statusEndpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status-Endpunkt</FormLabel>
                          <FormControl>
                            <Input placeholder="/orders" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="httpMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTTP-Methode</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            {...field}
                          >
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  render={<Link href="/settings/integrations" />}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Speichern…" : "Änderungen speichern"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
