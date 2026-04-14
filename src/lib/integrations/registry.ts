import type { SupplierAdapter } from "./types";
import { DemoAdapter } from "./adapters/demo-adapter";
import { RestAdapter } from "./adapters/rest-adapter";

class AdapterRegistry {
  private adapters = new Map<string, SupplierAdapter>();

  register(adapter: SupplierAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): SupplierAdapter | undefined {
    return this.adapters.get(id);
  }

  getAll(): SupplierAdapter[] {
    return Array.from(this.adapters.values());
  }

  async getConfigured(): Promise<SupplierAdapter[]> {
    const results = await Promise.all(
      this.getAll().map(async (adapter) => ({
        adapter,
        configured: await adapter.isConfigured(),
      }))
    );
    return results
      .filter(({ configured }) => configured)
      .map(({ adapter }) => adapter);
  }

  /**
   * Creates a fully configured adapter instance for a specific SupplierConfig.
   * Returns null if the adapterId is unknown.
   */
  createConfiguredAdapter(
    adapterId: string,
    config: Record<string, unknown>
  ): SupplierAdapter | null {
    if (adapterId === "demo") return new DemoAdapter();
    if (adapterId === "rest") return new RestAdapter(config);
    return null;
  }
}

export const adapterRegistry = new AdapterRegistry();

// Register template adapters (used for listing / metadata)
adapterRegistry.register(new DemoAdapter());
adapterRegistry.register(new RestAdapter({}));
