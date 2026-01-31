export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}


export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'Delivered' | 'Cancelled' | 'Returned';
  items: OrderItem[];
}
