import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductsService, CreateProductDTO } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { SecurityService } from '../services/security.service';
import { Product } from '../models/product.model';
import { ProductFormComponent, ProductFormData } from '../product-form/product-form.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, ProductFormComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Form dialog state
  showForm = signal<boolean>(false);
  editingProduct = signal<Product | null>(null);

  constructor(
    private productsService: ProductsService,
    private cartService: CartService,
    public securityService: SecurityService
  ) {}

  ngOnInit(): void {
    console.log('[ProductsComponent] isAdmin:', this.securityService.isAdmin);
    console.log('[ProductsComponent] authStatus:', this.securityService.authStatus());
    this.fetchProducts();
  }

  fetchProducts(): void {
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

  addToCart(product: Product): void {
    this.cartService.add(product, 1);
    alert('Added to cart');
  }

  // Admin actions
  openAddForm(): void {
    console.log('[ProductsComponent] openAddForm called');
    this.editingProduct.set(null);
    this.showForm.set(true);
  }

  openEditForm(product: Product): void {
    console.log('[ProductsComponent] openEditForm called for:', product.name);
    this.editingProduct.set(product);
    this.showForm.set(true);
  }

  onFormSubmit(formData: ProductFormData): void {
    const data: CreateProductDTO = {
      name: formData.name,
      price: formData.price,
      quantity: formData.quantity
    };
    const editing = this.editingProduct();

    if (editing) {
      // Update existing product
      this.productsService.update(String(editing.id), data).subscribe({
        next: () => {
          this.closeForm();
          this.fetchProducts();
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
          this.closeForm();
          this.fetchProducts();
        },
        error: (err) => {
          console.error('Failed to create product:', err);
          this.error.set('Failed to create product');
        }
      });
    }
  }

  onFormCancel(): void {
    this.closeForm();
  }

  private closeForm(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
  }

  deleteProduct(product: Product): void {
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