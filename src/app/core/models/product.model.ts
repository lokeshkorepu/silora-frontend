export interface Product {
  id?: string;
  name: string;
  price: number;
  imageUrl?: string;   // ✅ ONLY THIS  
  quantity?: string;
  category: string;
  count?: number;
}
