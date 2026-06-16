import type { Product } from '../types/product';

export interface ProductRepository {
  getAll(): Promise<Product[]>;
}
