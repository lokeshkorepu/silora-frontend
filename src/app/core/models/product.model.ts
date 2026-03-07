export interface ProductVariant {
  id?: string;
  quantity: string;
  price: number;
  mrp: number;
  stock: number;
  image?: string;
}

export interface Product {

  id?: string;
  name: string;
  
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  
  quantityValue?: number;
  quantityUnit?: string;
  stockQuantity?: number;

  hsnCode?: string;
  gstType?: string;
  gstPercentage?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  cess?: number;

  imageUrl?: string;   // ✅ ONLY THIS
  createdAt?: Date;   // ✅ add this line
  updatedAt?: any;
  
  categoryId?: string;
  categoryName?: string;

  subcategoryId?: string;
  subcategoryName?: string;

  isActive?: boolean;
  nameLower?: string;

  count?: number;

  optionsCount?: number;

  variants?: ProductVariant[];

}
