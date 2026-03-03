export interface Product {

  id?: string;
  name: string;
  price: number;

  originalPrice?: number;
  discountPercentage?: number;
  
  quantity?: string;
  stockQuantity?: number;

  imageUrl?: string;   // ✅ ONLY THIS
  createdAt?: Date;   // ✅ add this line

  categoryId?: string;
  categoryName?: string;

  subcategoryId?: string;
  subcategoryName?: string;

  isActive?: boolean;
  nameLower?: string;

  count?: number;

}
