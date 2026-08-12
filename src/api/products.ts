// src/api/products.ts
import { Product } from '../types';
import { mockProducts } from '../mocks/products';
import { delay } from './delay';

// Backend sözleşmesi: GET /products/qr/:qrCode
export async function getProductByQrCode(qrCode: string): Promise<Product | undefined> {
  await delay();
  return mockProducts.find((p) => p.qrCode === qrCode);
}

// Backend sözleşmesi: GET /products?ids=p1,p2,p3
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  await delay();
  return mockProducts.filter((p) => ids.includes(p.id));
}