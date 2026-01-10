import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  total = 0;

  constructor(private cart: CartService) {}

  ngOnInit(): void {
    this.sync();
    this.cart.cartChanges.subscribe(() => this.sync());
  }

  increase(item: CartItem) {
    this.cart.update(item.product.id, item.quantity + 1);
  }

  decrease(item: CartItem) {
    const next = Math.max(1, item.quantity - 1);
    this.cart.update(item.product.id, next);
  }

  remove(item: CartItem) {
    this.cart.remove(item.product.id);
  }

  checkout() {
    alert('Order placed (demo)');
    this.cart.clear();
  }

  private sync() {
    this.items = this.cart.snapshot;
    this.total = this.cart.total();
  }
}
