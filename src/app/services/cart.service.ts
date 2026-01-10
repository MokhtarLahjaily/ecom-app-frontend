import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateBillRequest {
  productItems: ProductItemRequest[];
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private readonly BILLING_API = 'http://localhost:8888/billing-service/bills';

  private items: CartItem[] = [];
  private items$ = new BehaviorSubject<CartItem[]>([]);

  get cartChanges() {
    return this.items$.asObservable();
  }

  get snapshot(): CartItem[] {
    return this.items;
  }

  add(product: Product, quantity = 1) {
    const idx = this.items.findIndex((i) => i.product.id === product.id);
    if (idx >= 0) {
      this.items[idx] = { ...this.items[idx], quantity: this.items[idx].quantity + quantity };
    } else {
      this.items.push({ product, quantity });
    }
    this.publish();
  }

  update(productId: number, quantity: number) {
    this.items = this.items.map((i) =>
      i.product.id === productId ? { ...i, quantity: Math.max(1, quantity) } : i
    );
    this.publish();
  }

  remove(productId: number) {
    this.items = this.items.filter((i) => i.product.id !== productId);
    this.publish();
  }

  clear() {
    this.items = [];
    this.publish();
  }

  total(): number {
    return this.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  /**
   * Envoie le panier au backend pour créer une facture.
   * Transforme les CartItem[] en CreateBillRequest puis vide le panier après succès.
   */
  checkout(): Observable<any> {
    const request: CreateBillRequest = {
      productItems: this.items.map(item => ({
        productId: String(item.product.id),
        quantity: item.quantity,
        unitPrice: item.product.price
      }))
    };

    return this.http.post(this.BILLING_API, request).pipe(
      tap(() => this.clear())
    );
  }

  private publish() {
    this.items$.next([...this.items]);
  }
}
