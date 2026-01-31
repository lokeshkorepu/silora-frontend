export interface OrderDTO {
  id: string;
  createdAt: string;        // ISO string
  totalAmount: number;
  status: 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  items: OrderItemDTO[];
}

export interface OrderItemDTO {
  productId: number;
  price: number;
  quantity: number;
}
