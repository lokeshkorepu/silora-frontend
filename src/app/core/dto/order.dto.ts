export interface OrderDTO {
  id: string;
  createdAt: string;        // ISO string
  totalAmount: number;
  status: 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  items: OrderItemDTO[];
}

export interface OrderItemDTO {

  productId: string;
  name: string;
  price: number;

  quantityValue: number;
  quantityUnit: string;

  orderQuantity: number;

  imageUrl?: string;
}
