import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);

  /** Read-only signal of current toasts */
  readonly toasts = computed(() => this._toasts());

  /**
   * Display a toast notification.
   * Auto-removes after 3 seconds.
   */
  show(message: string, type: ToastType = 'info'): void {
    const id = this.nextId++;
    const toast: Toast = { id, message, type };

    this._toasts.update(list => [...list, toast]);

    // Auto-remove after 3 seconds
    setTimeout(() => this.remove(id), 3000);
  }

  /** Manually remove a toast by id */
  remove(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  /** Convenience methods */
  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }
}
