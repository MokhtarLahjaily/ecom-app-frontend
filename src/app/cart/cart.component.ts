import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  loading = false;
  error: string | null = null;

  constructor(private cart: CartService, private router: Router) {}

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
    if (this.items.length === 0) {
      this.error = 'Your cart is empty.';
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    this.cart.checkout().subscribe({
      next: (bill) => {
        this.loading = false;
        alert('Order placed successfully!');
        this.router.navigate(['/my-bills']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Checkout failed:', err);
        this.error = 'Failed to place order. Please try again.';
      }
    });
  }

  private sync() {
    this.items = this.cart.snapshot;
    this.total = this.cart.total();
  }
}
