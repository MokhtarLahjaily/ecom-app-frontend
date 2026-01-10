import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../models/customer.model';
import { Bill } from '../models/bill.model';

@Injectable({
    providedIn: 'root'
})
export class ConsumerService {
    private gatewayUrl = 'http://localhost:8888';

    constructor(private http: HttpClient) { }

    public getCustomers(): Observable<any> {
        return this.http.get(`${this.gatewayUrl}/customer-service/api/customers`);
    }

    public getBillsByCustomerID(customerId: number): Observable<any> {
        return this.http.get(`${this.gatewayUrl}/billing-service/api/bills/search/findByCustomerId?customerId=${customerId}&projection=fullBill`);
    }

    public getAllBills(): Observable<any> {
        return this.http.get(`${this.gatewayUrl}/billing-service/api/bills?projection=fullBill`);
    }

    public getMyBills(): Observable<Bill[]> {
        return this.http.get<Bill[]>(`${this.gatewayUrl}/billing-service/bills/me`);
    }

    public getBillDetails(id: number): Observable<Bill> {
        return this.http.get<Bill>(`${this.gatewayUrl}/billing-service/bills/${id}`);
    }
}
