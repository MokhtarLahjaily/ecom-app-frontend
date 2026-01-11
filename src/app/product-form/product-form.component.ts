import { 
  Component, 
  input, 
  output, 
  signal, 
  effect, 
  ViewChild, 
  ElementRef, 
  AfterViewInit,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../models/product.model';

export interface ProductFormData {
  name: string;
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements AfterViewInit {
  @ViewChild('productDialog') dialogRef!: ElementRef<HTMLDialogElement>;
  
  private platformId = inject(PLATFORM_ID);

  // Input signal for the product to edit (null for new product)
  product = input<Product | null>(null);
  
  // Input signal to control dialog visibility
  isOpen = input<boolean>(false);

  // Output events
  formSubmit = output<ProductFormData>();
  formCancel = output<void>();

  // Form state using signals
  formName = signal<string>('');
  formPrice = signal<number>(0);
  formQuantity = signal<number>(0);

  constructor() {
    // Effect to sync form fields when product input changes
    effect(() => {
      const prod = this.product();
      if (prod) {
        this.formName.set(prod.name);
        this.formPrice.set(prod.price);
        this.formQuantity.set(prod.quantity);
      } else {
        this.resetForm();
      }
    });

    // Effect to open/close dialog when isOpen changes
    effect(() => {
      const open = this.isOpen();
      // Only manipulate dialog in browser environment (not SSR)
      if (!isPlatformBrowser(this.platformId)) return;
      
      // Use setTimeout to ensure dialog ref is available
      setTimeout(() => {
        if (open) {
          this.dialogRef?.nativeElement?.showModal();
        } else {
          this.dialogRef?.nativeElement?.close();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    // Only add event listener in browser environment (not SSR)
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Listen for native dialog close event (e.g., pressing Escape key)
    this.dialogRef?.nativeElement?.addEventListener('close', () => {
      this.formCancel.emit();
    });
  }

  get isEditing(): boolean {
    return this.product() !== null;
  }

  resetForm(): void {
    this.formName.set('');
    this.formPrice.set(0);
    this.formQuantity.set(0);
  }

  onSubmit(): void {
    const formData: ProductFormData = {
      name: this.formName(),
      price: this.formPrice(),
      quantity: this.formQuantity()
    };
    this.formSubmit.emit(formData);
  }

  onCancel(): void {
    this.dialogRef?.nativeElement?.close();
    this.formCancel.emit();
  }

  onDialogBackdropClick(event: MouseEvent): void {
    // Close dialog when clicking on the backdrop (the dialog element itself)
    if (event.target === this.dialogRef?.nativeElement) {
      this.onCancel();
    }
  }

  // Two-way binding helpers for template
  updateName(value: string): void {
    this.formName.set(value);
  }

  updatePrice(value: number): void {
    this.formPrice.set(value);
  }

  updateQuantity(value: number): void {
    this.formQuantity.set(value);
  }
}
