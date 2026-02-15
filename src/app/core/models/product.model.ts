export interface Product {

  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  imageUrl?: string;   // ✅ ONLY THIS  
  quantity?: string;   
  category: string;
  count?: number;
  createdAt?: Date;   // ✅ add this line
  // oldPrice?: number;

}
