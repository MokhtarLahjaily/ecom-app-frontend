import { 
  Component, 
  input, 
  output, 
  effect, 
  ViewChild, 
  ElementRef, 
  AfterViewInit,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Product } from '../models/product.model';

export interface ProductFormData {
  name: string;
  price: number;
  quantity: number;
}

/** Strongly-typed form structure */
interface ProductFormControls {
  name: FormControl<string>;
  price: FormControl<number>;
  quantity: FormControl<number>;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements AfterViewInit {
  @ViewChild('productDialog') dialogRef!: ElementRef<HTMLDialogElement>;
  
  private platformId = inject(PLATFORM_ID);
  private fb = inject(FormBuilder);

  // Input signal for the product to edit (null for new product)
  product = input<Product | null>(null);
  
  // Input signal to control dialog visibility
  isOpen = input<boolean>(false);

  // Output events
  formSubmit = output<ProductFormData>();
  formCancel = output<void>();

  // Strongly-typed reactive form
  form: FormGroup<ProductFormControls> = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3)
    ]),
    price: this.fb.nonNullable.control(0, [
      Validators.required,
      Validators.min(0.01)
    ]),
    quantity: this.fb.nonNullable.control(0, [
      Validators.required,
      Validators.min(0)
    ])
  });

  constructor() {
    // Effect to sync form values when product input changes (edit mode)
    effect(() => {
      const prod = this.product();
      if (prod) {
        this.form.patchValue({
          name: prod.name,
          price: prod.price,
          quantity: prod.quantity
        });
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

  /** Convenience getters for template validation */
  get nameControl() { return this.form.controls.name; }
  get priceControl() { return this.form.controls.price; }
  get quantityControl() { return this.form.controls.quantity; }

  resetForm(): void {
    this.form.reset({
      name: '',
      price: 0,
      quantity: 0
    });
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  onSubmit(): void {
    // Mark all fields as touched to trigger validation display
    this.form.markAllAsTouched();
    
    if (this.form.invalid) {
      return;
    }

    const formData: ProductFormData = {
      name: this.form.controls.name.value,
      price: this.form.controls.price.value,
      quantity: this.form.controls.quantity.value
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
}
