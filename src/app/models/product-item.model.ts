import { Product } from "./product.model";

export interface ProductItem {
    id: number;
    productId: string;
    unitPrice: number;
    quantity: number;
    product?: Product;
}
