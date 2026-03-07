export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  
  quantityValue: number;   // per unit weight
  quantityUnit: string;    // g, kg, ml

  orderQuantity: number;   // how many units user bought  
  
  imageUrl?: string;
  category?: string;
}


export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Delivered' | 'Cancelled' | 'Returned'| 'Pending';
  items: OrderItem[];
}
