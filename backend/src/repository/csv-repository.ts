import fs from 'fs';
import { parse } from 'csv-parse';
import { CsvRowSchema } from '../schemas/product';
import type { Product } from '../types/product';
import type { ProductRepository } from './product-repository';

export class CsvRepository implements ProductRepository {
  constructor(private readonly csvPath: string) {}

  async getAll(): Promise<Product[]> {
    const products: Product[] = [];
    const seenIds = new Set<string>();

    await new Promise<void>((resolve, reject) => {
      const parser = fs
        .createReadStream(this.csvPath)
        .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));

      let rowIndex = 0;

      parser.on('data', (row: Record<string, string>) => {
        rowIndex++;
        const result = CsvRowSchema.safeParse(row);

        if (!result.success) {
          console.warn(`[csv] Row ${rowIndex} skipped: ${result.error.message}`);
          return;
        }

        const data = result.data;

        if (seenIds.has(data.id)) {
          console.warn(`[csv] Duplicate ID "${data.id}" at row ${rowIndex}, skipping`);
          return;
        }

        seenIds.add(data.id);
        products.push({
          id: data.id,
          title: data.title,
          description: data.description,
          vendor: data.vendor,
          price: data.price,
          inventory: data.inventory,
          imageUrl: data.image_url ?? null,
        });
      });

      parser.on('error', reject);
      parser.on('end', resolve);
    });

    return products;
  }
}
