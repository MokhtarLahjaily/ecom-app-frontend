import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
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

  private publish() {
    this.items$.next([...this.items]);
  }
}
