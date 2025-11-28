import { Customer } from "./customer.model";
import { ProductItem } from "./product-item.model";

export interface Bill {
    id: number;
    billingDate: string;
    customerId: number;
    productItems: ProductItem[];
    customer?: Customer;
}
