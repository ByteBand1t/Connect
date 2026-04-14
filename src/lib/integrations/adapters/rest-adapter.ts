import type {
  SupplierAdapter,
  OrderWithItems,
  SubmitOrderResult,
  ExternalOrderStatus,
  ConnectionTestResult,
} from "../types";

interface RestAdapterConfig {
  baseUrl: string;
  apiKey?: string;
  headerName?: string;
  submitEndpoint?: string;
  statusEndpoint?: string;
  httpMethod?: string;
}

const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "ERROR",
  "UNKNOWN",
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

function normalizeStatus(raw: unknown): ValidStatus {
  const s = String(raw ?? "UNKNOWN").toUpperCase();
  return (VALID_STATUSES as readonly string[]).includes(s)
    ? (s as ValidStatus)
    : "UNKNOWN";
}

export class RestAdapter implements SupplierAdapter {
  id = "rest";
  name = "REST-API-Adapter";
  description =
    "Generischer Adapter für beliebige REST-APIs. Konfigurierbar mit Basis-URL, API-Key und Endpunkten.";

  private cfg: RestAdapterConfig;

  constructor(config: Record<string, unknown>) {
    this.cfg = {
      baseUrl: typeof config.baseUrl === "string" ? config.baseUrl.replace(/\/$/, "") : "",
      apiKey: typeof config.apiKey === "string" ? config.apiKey : undefined,
      headerName:
        typeof config.headerName === "string" ? config.headerName : "X-API-Key",
      submitEndpoint:
        typeof config.submitEndpoint === "string"
          ? config.submitEndpoint
          : "/orders",
      statusEndpoint:
        typeof config.statusEndpoint === "string"
          ? config.statusEndpoint
          : "/orders",
      httpMethod:
        typeof config.httpMethod === "string" ? config.httpMethod : "POST",
    };
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(this.cfg.baseUrl);
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.cfg.apiKey && this.cfg.headerName) {
      headers[this.cfg.headerName] = this.cfg.apiKey;
    }
    return headers;
  }

  private withTimeout(ms: number): AbortController {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), ms);
    return ctrl;
  }

  async submitOrder(order: OrderWithItems): Promise<SubmitOrderResult> {
    const url = `${this.cfg.baseUrl}${this.cfg.submitEndpoint ?? "/orders"}`;
    const ctrl = this.withTimeout(10_000);

    try {
      const response = await fetch(url, {
        method: this.cfg.httpMethod ?? "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(order),
        signal: ctrl.signal,
      });

      if (!response.ok) {
        return {
          success: false,
          errors: [
            `HTTP ${response.status}: ${response.statusText}`,
          ],
        };
      }

      const data = (await response.json()) as Record<string, unknown>;
      const externalOrderId = String(
        data.id ?? data.orderId ?? data.externalId ?? data.order_id ?? ""
      );

      return {
        success: true,
        externalOrderId: externalOrderId || undefined,
        message: "Bestellung erfolgreich übermittelt.",
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, errors: ["Request-Timeout nach 10 Sekunden."] };
      }
      return {
        success: false,
        errors: [err instanceof Error ? err.message : "Unbekannter Netzwerkfehler."],
      };
    }
  }

  async getOrderStatus(
    externalOrderId: string
  ): Promise<ExternalOrderStatus> {
    const endpoint = this.cfg.statusEndpoint ?? "/orders";
    const url = `${this.cfg.baseUrl}${endpoint}/${externalOrderId}`;
    const ctrl = this.withTimeout(10_000);

    try {
      const response = await fetch(url, {
        headers: this.buildHeaders(),
        signal: ctrl.signal,
      });

      if (!response.ok) {
        return { status: "ERROR", lastUpdated: new Date() };
      }

      const data = (await response.json()) as Record<string, unknown>;

      return {
        status: normalizeStatus(data.status),
        lastUpdated: new Date(),
        trackingNumber:
          typeof data.trackingNumber === "string"
            ? data.trackingNumber
            : undefined,
        estimatedDelivery:
          typeof data.estimatedDelivery === "string"
            ? new Date(data.estimatedDelivery)
            : undefined,
        rawResponse: data,
      };
    } catch (err: unknown) {
      return {
        status: "ERROR",
        lastUpdated: new Date(),
        rawResponse: {
          error: err instanceof Error ? err.message : "Unknown error",
        },
      };
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    if (!this.cfg.baseUrl) {
      return { success: false, message: "Keine Basis-URL konfiguriert." };
    }

    const ctrl = this.withTimeout(10_000);
    const start = Date.now();

    try {
      const response = await fetch(this.cfg.baseUrl, {
        method: "HEAD",
        headers: this.buildHeaders(),
        signal: ctrl.signal,
      });

      const latencyMs = Date.now() - start;

      if (response.status >= 200 && response.status < 400) {
        return {
          success: true,
          message: `Verbindung erfolgreich (HTTP ${response.status}).`,
          latencyMs,
        };
      }

      return {
        success: false,
        message: `Verbindungsfehler: HTTP ${response.status} ${response.statusText}.`,
        latencyMs,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, message: "Verbindungs-Timeout nach 10 Sekunden." };
      }
      return {
        success: false,
        message: err instanceof Error ? err.message : "Unbekannter Fehler.",
      };
    }
  }
}
