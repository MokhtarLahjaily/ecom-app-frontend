import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService, CreateProductDTO } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { SecurityService } from '../services/security.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Admin: Product form state
  showForm = signal<boolean>(false);
  editingProduct = signal<Product | null>(null);
  
  // Form model (two-way binding friendly)
  formName = '';
  formPrice = 0;
  formQuantity = 0;

  constructor(
    private productsService: ProductsService,
    private cartService: CartService,
    public securityService: SecurityService
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  fetchProducts() {
    this.loading.set(true);
    this.error.set(null);
    this.productsService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error(err);
        this.error.set('Failed to load products');
        this.loading.set(false);
      }
    });
  }

  addToCart(product: Product) {
    this.cartService.add(product, 1);
    alert('Added to cart');
  }

  // Admin actions
  openAddForm() {
    this.editingProduct.set(null);
    this.formName = '';
    this.formPrice = 0;
    this.formQuantity = 0;
    this.showForm.set(true);
  }

  openEditForm(product: Product) {
    this.editingProduct.set(product);
    this.formName = product.name;
    this.formPrice = product.price;
    this.formQuantity = product.quantity;
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingProduct.set(null);
  }

  saveProduct() {
    const data: CreateProductDTO = {
      name: this.formName,
      price: this.formPrice,
      quantity: this.formQuantity
    };
    const editing = this.editingProduct();
    
    if (editing) {
      // Update existing product
      this.productsService.update(String(editing.id), data).subscribe({
        next: () => {
          this.fetchProducts();
          this.cancelForm();
        },
        error: (err) => {
          console.error('Failed to update product:', err);
          this.error.set('Failed to update product');
        }
      });
    } else {
      // Create new product
      this.productsService.create(data).subscribe({
        next: () => {
          this.fetchProducts();
          this.cancelForm();
        },
        error: (err) => {
          console.error('Failed to create product:', err);
          this.error.set('Failed to create product');
        }
      });
    }
  }

  deleteProduct(product: Product) {
    if (confirm(`Delete "${product.name}"?`)) {
      this.productsService.delete(String(product.id)).subscribe({
        next: () => this.fetchProducts(),
        error: (err) => {
          console.error('Failed to delete product:', err);
          this.error.set('Failed to delete product');
        }
      });
    }
  }
}