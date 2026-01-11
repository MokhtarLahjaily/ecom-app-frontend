import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../models/customer.model';
import { Bill } from '../models/bill.model';
import { mapSpringDataResponse } from '../core/utils/api-utils';

@Injectable({
    providedIn: 'root'
})
export class ConsumerService {
    private gatewayUrl = 'http://localhost:8888';

    constructor(private http: HttpClient) { }

    public getCustomers(): Observable<Customer[]> {
        return this.http.get<unknown>(`${this.gatewayUrl}/customer-service/api/customers`)
            .pipe(mapSpringDataResponse<Customer>('customers'));
    }

    public getBillsByCustomerID(customerId: number): Observable<Bill[]> {
        return this.http.get<unknown>(`${this.gatewayUrl}/billing-service/api/bills/search/findByCustomerId?customerId=${customerId}&projection=fullBill`)
            .pipe(mapSpringDataResponse<Bill>('bills'));
    }

    public getAllBills(): Observable<Bill[]> {
        return this.http.get<unknown>(`${this.gatewayUrl}/billing-service/api/bills?projection=fullBill`)
            .pipe(mapSpringDataResponse<Bill>('bills'));
    }

    public getMyBills(): Observable<Bill[]> {
        return this.http.get<unknown>(`${this.gatewayUrl}/billing-service/bills/search/by-user`)
            .pipe(mapSpringDataResponse<Bill>('bills'));
    }

    public getBillDetails(id: number): Observable<Bill> {
        return this.http.get<Bill>(`${this.gatewayUrl}/billing-service/bills/${id}`);
    }
}
