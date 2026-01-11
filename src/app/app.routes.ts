import { Routes } from '@angular/router';
import { ProductsComponent } from './products/products.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { CartComponent } from './cart/cart.component';
import { CustomersComponent } from './customers/customers.component';
import { BillsComponent } from './bills/bills.component';
import { BillsDetailsComponent } from './bills-details/bills-details.component';
import { AnalyticsComponent } from './analytics/analytics.component';

export const routes: Routes = [
    { path: '', redirectTo: 'products', pathMatch: 'full' },
    { path: 'products', component: ProductsComponent },
    { path: 'products/:id', component: ProductDetailComponent },
    { path: 'cart', component: CartComponent },
    { path: 'customers', component: CustomersComponent },
    { path: 'bills', component: BillsComponent },
    { path: 'my-bills', component: BillsComponent, data: { mode: 'me' } },
    { path: 'bills/:customerId', component: BillsComponent },
    { path: 'bill-details/:billId', component: BillsDetailsComponent },
    // Route Analytics (Admin only)
    { path: 'admin/analytics', component: AnalyticsComponent }
];
