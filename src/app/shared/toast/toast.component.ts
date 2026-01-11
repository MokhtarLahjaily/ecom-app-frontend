import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast" 
          [class.toast-success]="toast.type === 'success'"
          [class.toast-error]="toast.type === 'error'"
          [class.toast-info]="toast.type === 'info'"
        >
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Close">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-radius: 8px;
      color: #fff;
      font-size: 0.95rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    }

    .toast-success {
      background: linear-gradient(135deg, #28a745, #218838);
    }

    .toast-error {
      background: linear-gradient(135deg, #dc3545, #c82333);
    }

    .toast-info {
      background: linear-gradient(135deg, #17a2b8, #138496);
    }

    .toast-message {
      flex: 1;
      margin-right: 12px;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: inherit;
      font-size: 1.4rem;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.2s;
      padding: 0;
      line-height: 1;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastComponent {
  protected toastService = inject(ToastService);
}
