import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, switchMap, startWith, catchError, of, tap, finalize } from 'rxjs';
import { ProductsService, CreateProductDTO } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { SecurityService } from '../services/security.service';
import { ToastService } from '../services/toast.service';
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
  private toastService = inject(ToastService);
  public securityService = inject(SecurityService);

  // Subject to trigger refetch
  private readonly refetch$ = new Subject<void>();

  // Loading state for skeleton display
  readonly isLoading = signal<boolean>(true);

  // Skeleton placeholder array for template
  readonly skeletonItems = [1, 2, 3, 4, 5, 6];

  // Read-only signal with automatic subscription management
  readonly products = toSignal(
    this.refetch$.pipe(
      startWith(undefined),
      tap(() => this.isLoading.set(true)),
      switchMap(() => this.productsService.getProducts().pipe(
        tap(() => this.isLoading.set(false)),
        catchError(err => {
          console.error(err);
          this.error.set('Failed to load products');
          this.isLoading.set(false);
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

  // Track loading state per product ID for button spinners
  readonly actionLoading = signal<Set<number>>(new Set());

  /** Update loading state for a specific product ID */
  private setLoading(id: number, isLoading: boolean): void {
    this.actionLoading.update(set => {
      const newSet = new Set(set);
      if (isLoading) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }

  /** Trigger a refetch of products */
  refetchProducts(): void {
    this.error.set(null);
    this.refetch$.next();
  }

  addToCart(product: Product): void {
    this.setLoading(product.id, true);
    // Simulate async operation for visual feedback
    setTimeout(() => {
      this.cartService.add(product, 1);
      this.toastService.success('Product added to cart');
      this.setLoading(product.id, false);
    }, 300);
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
          this.toastService.success('Product updated successfully');
        },
        error: (err) => {
          console.error('Failed to update product:', err);
          this.toastService.error('Failed to update product');
        }
      });
    } else {
      // Create new product
      this.productsService.create(data).subscribe({
        next: () => {
          this.closeForm();
          this.refetchProducts();
          this.toastService.success('Product created successfully');
        },
        error: (err) => {
          console.error('Failed to create product:', err);
          this.toastService.error('Failed to create product');
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
      this.setLoading(product.id, true);
      this.productsService.delete(String(product.id)).pipe(
        finalize(() => this.setLoading(product.id, false))
      ).subscribe({
        next: () => {
          this.refetchProducts();
          this.toastService.success('Product deleted successfully');
        },
        error: (err) => {
          console.error('Failed to delete product:', err);
          this.toastService.error('Failed to delete product');
        }
      });
    }
  }
}