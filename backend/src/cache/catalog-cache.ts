import type { Product } from '../types/product';
import type { ProductRepository } from '../repository/product-repository';

export class CatalogCache {
  private products: Product[] | null = null;

  constructor(private readonly repository: ProductRepository) {}

  async load(): Promise<void> {
    this.products = await this.repository.getAll();
  }

  isReady(): boolean {
    return this.products !== null && this.products.length > 0;
  }

  getProducts(): Product[] {
    return this.products ?? [];
  }

  getCount(): number {
    return this.products?.length ?? 0;
  }

  // Reload the catalog every `intervalMs` ms in the background.
  // Uses unref() so the timer never prevents a clean process exit.
  startPeriodicRefresh(intervalMs = 15 * 60 * 1000): void {
    const timer = setInterval(async () => {
      console.log('[catalog-cache] Refreshing catalog...');
      try {
        const fresh = await this.repository.getAll();
        this.products = fresh;
        console.log(`[catalog-cache] Refreshed: ${fresh.length} products`);
      } catch (err) {
        console.error(
          '[catalog-cache] Refresh failed (keeping existing catalog):',
          err instanceof Error ? err.message : err,
        );
      }
    }, intervalMs);
    timer.unref();
  }
}
