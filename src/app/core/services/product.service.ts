import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  docData,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
  getDocs,
  serverTimestamp
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable, BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  /* ================= SEARCH STATE ================= */

  private searchSubject = new BehaviorSubject<string>('');
  search$ = this.searchSubject.asObservable();

  searchProducts(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  getProductsBySearch(searchTerm: string): Observable<Product[]> {

    const productsRef = collection(this.firestore, 'products');

    if (!searchTerm || searchTerm.trim() === '') {
      return collectionData(productsRef, { idField: 'id' }) as Observable<Product[]>;
    }

    const lowerSearch = searchTerm.toLowerCase();

    const q = query(
      productsRef,
      orderBy('nameLower'),
      startAt(lowerSearch),
      endAt(lowerSearch + '\uf8ff')
    );

    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  /* ================= ROOT PRODUCTS ================= */

getProducts(): Observable<Product[]> {
  const productsRef = collection(this.firestore, 'products');
  return collectionData(productsRef, { idField: 'id' }) as Observable<Product[]>;
}

  getProductById(id: string): Observable<Product | undefined> {
    const productRef = doc(this.firestore, 'products', id);
    return docData(productRef, { idField: 'id' }) as Observable<Product>;
  }

  getFilteredProducts(category: string, pageSize: number): Observable<Product[]> {

    const productsRef = collection(this.firestore, 'products');

    let constraints: any[] = [];

    if (category && category !== 'all') {
      constraints.push(where('categoryId', '==', category));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageSize));

    const q = query(productsRef, ...constraints);

    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  getAllProductsCount() {
    const ref = collection(this.firestore, 'products');
    return collectionData(ref, { idField: 'id' }).pipe(
      map(products => products.length)
    );
  }
//Add Product
async addProduct(product: any, file: File): Promise<string> {

  const storageRef = ref(
    this.storage,
    `products/${Date.now()}_${file.name}`
  );

  await uploadBytes(storageRef, file);

  const imageUrl = await getDownloadURL(storageRef);

  const productsRef = collection(this.firestore, 'products');

  const docRef = await addDoc(productsRef, {
    ...product,
    nameLower: product.name.toLowerCase(),
    imageUrl,
    createdAt: serverTimestamp(),
    isActive: true
  });

  return docRef.id;

}

async addVariant(productId: string, variant: any, file?: File) {

  let imageUrl = '';

  if (file) {

    const storageRef = ref(
      this.storage,
      `variants/${Date.now()}_${file.name}`
    );

    await uploadBytes(storageRef, file);

    imageUrl = await getDownloadURL(storageRef);

  }

  const variantsRef = collection(
    this.firestore,
    `products/${productId}/variants`
  );

  await addDoc(variantsRef, {
    ...variant,
    image: imageUrl
  });

}

getProductVariants(productId: string) {

  const variantsRef = collection(
    this.firestore,
    `products/${productId}/variants`
  );

  return collectionData(variantsRef, { idField: 'id' });

}

  async deleteProduct(id: string): Promise<void> {
    const productRef = doc(this.firestore, 'products', id);
    await deleteDoc(productRef);
  }

  async updateProduct(id: string, product: any, file?: File): Promise<void> {
    const productRef = doc(this.firestore, 'products', id);
    await updateDoc(productRef, {
      ...product,
      nameLower: product.name?.toLowerCase()
    });
  }

  /* ================= NESTED PRODUCTS ================= */

  getProductsByCategoryAndSubcategory(
    categoryId: string,
    subcategoryId: string
  ): Observable<Product[]> {

    const productsRef = collection(this.firestore, 'products');

    const q = query(
      productsRef,
      where('categoryId', '==', categoryId),
      where('subcategoryId', '==', subcategoryId)
  );

    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  async addProductToSubcategory(
  categoryId: string,  
  subcategoryId: string,
  productData: any,
  file: File
) {

  // 1️⃣ Upload image
  const filePath = `products/${Date.now()}_${file.name}`;
  const storageRef = ref(this.storage, filePath);

  await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(storageRef);

  // 2️⃣ Save product in top-level collection
await addDoc(collection(this.firestore, 'products'), {
  ...productData,
  categoryId: categoryId,          // ✅ IMPORTANT
  subcategoryId: subcategoryId,
  imageUrl,
  createdAt: serverTimestamp(),
  isActive: true
});
}

// 🔹 Get Products by SubCategory ID
  getProductsBySubCategory(subCategoryId: string): Observable<any[]> {
    const productsRef = collection(this.firestore, 'products');
    const q = query(
      productsRef,
      where('subcategoryId', '==', subCategoryId),
      where('isActive', '==', true),
      orderBy('createdAt', 'asc')   // 🔥 important
    );
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }
}