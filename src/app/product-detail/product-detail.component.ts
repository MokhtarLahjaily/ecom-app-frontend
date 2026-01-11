import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { ToastService } from '../services/toast.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  loading = true;
  error?: string;

  constructor(
    private route: ActivatedRoute,
    private productsService: ProductsService,
    private cart: CartService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Missing product id';
      this.loading = false;
      return;
    }
    this.productsService.getById(id).subscribe({
      next: (p) => {
        this.product = p;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load product';
        this.loading = false;
      }
    });
  }

  addToCart() {
    if (this.product) {
      this.cart.add(this.product, 1);
      this.toastService.success('Product added to cart');
    }
  }
}
