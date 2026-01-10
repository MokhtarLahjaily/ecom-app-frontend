import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Product } from '../models/product.model';

export interface CreateProductDTO {
  name: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private gatewayUrl = 'http://localhost:8888';

  constructor(private http: HttpClient) {}

  // Alias used by components
  getProducts(): Observable<Product[]> {
    return this.getAll();
  }

  getAll(): Observable<Product[]> {
    return this.http
      .get<any>(`${this.gatewayUrl}/inventory-service/api/products?size=200`)
      .pipe(map((res) => res._embedded?.products ?? []));
  }

  getById(id: string | number): Observable<Product> {
    return this.http.get<Product>(`${this.gatewayUrl}/inventory-service/api/products/${id}`);
  }

  // Admin: Create a new product
  create(product: CreateProductDTO): Observable<Product> {
    return this.http.post<Product>(`${this.gatewayUrl}/inventory-service/api/products`, product);
  }

  // Admin: Update a product
  update(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.gatewayUrl}/inventory-service/api/products/${id}`, product);
  }

  // Admin: Delete a product
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.gatewayUrl}/inventory-service/api/products/${id}`);
  }
}
