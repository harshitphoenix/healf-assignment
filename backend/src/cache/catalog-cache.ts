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
}
