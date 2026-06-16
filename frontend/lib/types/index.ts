export interface Product {
  id: string;
  title: string;
  description: string;
  vendor: string;
  price: number;
  inventory: number;
  imageUrl: string | null;
}

export interface ResponseMeta {
  page: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
}

export interface ProductsResponse {
  products: Product[];
  meta: ResponseMeta;
}
