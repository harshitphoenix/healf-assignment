import { describe, it, expect } from 'vitest';
import path from 'path';
import { CsvRepository } from '../src/repository/csv-repository';

const FIXTURES = path.join(__dirname, 'fixtures');

describe('CsvRepository', () => {
  it('parses all valid rows into Product objects', async () => {
    const repo = new CsvRepository(path.join(FIXTURES, 'products.csv'));
    const products = await repo.getAll();

    expect(products).toHaveLength(3);
    expect(products[0]).toEqual({
      id: '1',
      title: 'Vitamin D3',
      description: 'Bone health support',
      vendor: 'Now Foods',
      price: 12.99,
      inventory: 200,
      imageUrl: null,
    });
  });

  it('converts non-empty image_url to a string', async () => {
    const repo = new CsvRepository(path.join(FIXTURES, 'products.csv'));
    const products = await repo.getAll();
    const withImage = products.find((p) => p.id === '2');

    expect(withImage?.imageUrl).toBe('https://example.com/omega.jpg');
  });

  it('converts empty image_url to null', async () => {
    const repo = new CsvRepository(path.join(FIXTURES, 'products.csv'));
    const products = await repo.getAll();
    const noImage = products.find((p) => p.id === '1');

    expect(noImage?.imageUrl).toBeNull();
  });

  it('skips invalid rows and continues parsing valid ones', async () => {
    const repo = new CsvRepository(path.join(FIXTURES, 'invalid-rows.csv'));
    const products = await repo.getAll();

    // 2 of 4 rows are invalid (non-numeric price, empty ID)
    expect(products).toHaveLength(2);
    const ids = products.map((p) => p.id);
    expect(ids).toContain('1');
    expect(ids).toContain('4');
  });

  it('skips rows with non-numeric price', async () => {
    const repo = new CsvRepository(path.join(FIXTURES, 'invalid-rows.csv'));
    const products = await repo.getAll();

    expect(products.every((p) => typeof p.price === 'number' && !isNaN(p.price))).toBe(true);
  });

  it('deduplicates by ID keeping only the first occurrence', async () => {
    const repo = new CsvRepository(path.join(FIXTURES, 'duplicate-ids.csv'));
    const products = await repo.getAll();

    // Row with id=1 appears twice; only the first is kept
    const withId1 = products.filter((p) => p.id === '1');
    expect(withId1).toHaveLength(1);
    expect(withId1[0].title).toBe('First Product');
  });

  it('returns two products when one duplicate ID is skipped', async () => {
    const repo = new CsvRepository(path.join(FIXTURES, 'duplicate-ids.csv'));
    const products = await repo.getAll();

    expect(products).toHaveLength(2);
  });

  it('returns an empty array for a CSV with only a header row', async () => {
    const repo = new CsvRepository(path.join(FIXTURES, 'empty.csv'));
    const products = await repo.getAll();

    expect(products).toHaveLength(0);
  });
});
