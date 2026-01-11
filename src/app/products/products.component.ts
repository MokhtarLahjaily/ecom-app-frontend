import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, switchMap, startWith, catchError, of } from 'rxjs';
import { ProductsService, CreateProductDTO } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { SecurityService } from '../services/security.service';
import { Product } from '../models/product.model';
import { ProductFormComponent, ProductFormData } from '../product-form/product-form.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductFormComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent {
  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  public securityService = inject(SecurityService);

  // Subject to trigger refetch
  private readonly refetch$ = new Subject<void>();

  // Read-only signal with automatic subscription management
  readonly products = toSignal(
    this.refetch$.pipe(
      startWith(undefined),
      switchMap(() => this.productsService.getProducts().pipe(
        catchError(err => {
          console.error(err);
          this.error.set('Failed to load products');
          return of([] as Product[]);
        })
      ))
    ),
    { initialValue: [] as Product[] }
  );

  error = signal<string | null>(null);
  
  // Form dialog state
  showForm = signal<boolean>(false);
  editingProduct = signal<Product | null>(null);

  /** Trigger a refetch of products */
  refetchProducts(): void {
    this.error.set(null);
    this.refetch$.next();
  }

  addToCart(product: Product): void {
    this.cartService.add(product, 1);
    alert('Added to cart');
  }

  // Admin actions
  openAddForm(): void {
    this.editingProduct.set(null);
    this.showForm.set(true);
  }

  openEditForm(product: Product): void {
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
          this.refetchProducts();
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
          this.refetchProducts();
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
        next: () => this.refetchProducts(),
        error: (err) => {
          console.error('Failed to delete product:', err);
          this.error.set('Failed to delete product');
        }
      });
    }
  }
}