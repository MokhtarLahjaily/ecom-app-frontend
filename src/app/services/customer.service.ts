import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface Customer {
  id: string;
  keycloakId: string;
  username: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private gatewayUrl = 'http://localhost:8888';

  constructor(private http: HttpClient) {}

  /**
   * Calls /api/customers/me to ensure the current Keycloak user exists as a Customer in the DB.
   * Creates the customer on first access.
   */
  syncCurrentUser(): Observable<Customer | null> {
    return this.http.get<Customer>(`${this.gatewayUrl}/customer-service/api/customers/me`).pipe(
      catchError(err => {
        console.warn('[CustomerService] Failed to sync customer:', err);
        return of(null);
      })
    );
  }

  getAll(): Observable<Customer[]> {
    return this.http.get<any>(`${this.gatewayUrl}/customer-service/api/customers`)
      .pipe(catchError(() => of([])));
  }
}
