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
  async addProduct(product: any, file: File): Promise<void> {

  const storageRef = ref(
    this.storage,
    `products/${Date.now()}_${file.name}`
  );

  await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(storageRef);

  const productsRef = collection(this.firestore, 'products');

  await addDoc(productsRef, {
    ...product,
    nameLower: product.name.toLowerCase(),
    imageUrl,
    createdAt: serverTimestamp(),
    isActive: true
  });
}

  async deleteProduct(id: string): Promise<void> {
    const productRef = doc(this.firestore, 'products', id);
    await deleteDoc(productRef);
  }

  async updateProduct(id: string, data: any): Promise<void> {
    const productRef = doc(this.firestore, 'products', id);
    await updateDoc(productRef, {
      ...data,
      nameLower: data.name?.toLowerCase()
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

  /* ================= MIGRATION METHOD (RESTORED) ================= */

  async migrateProductsToCorrectSlug(): Promise<void> {

    const productsSnapshot = await getDocs(
      collection(this.firestore, 'products')
    );

    const categoriesSnapshot = await getDocs(
      collection(this.firestore, 'categories')
    );

    const categoryMap = new Map<string, string>();

    categoriesSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      categoryMap.set(docSnap.id, data['slug']);
    });

    const mainCategoriesSnapshot = await getDocs(
      collection(this.firestore, 'mainCategories')
    );

    for (const productDoc of productsSnapshot.docs) {

      const productData = productDoc.data();
      const categoryId = productData['categoryId'];

      if (!categoryId) continue;

      const subSlug = categoryMap.get(categoryId);
      if (!subSlug) continue;

      let foundMainSlug: string | null = null;

      for (const mainDoc of mainCategoriesSnapshot.docs) {

        const mainSlug = mainDoc.data()['slug'];

        const subcategoriesSnapshot = await getDocs(
          collection(
            this.firestore,
            `mainCategories/${mainDoc.id}/subcategories`
          )
        );

        const match = subcategoriesSnapshot.docs.find(
          subDoc => subDoc.data()['slug'] === subSlug
        );

        if (match) {
          foundMainSlug = mainSlug;
          break;
        }
      }

      if (!foundMainSlug) continue;

      await updateDoc(productDoc.ref, {
        categorySlug: foundMainSlug,
        subcategorySlug: subSlug
      });
    }

    console.log('Product slug migration completed');
  }

    // 🔹 Get Products by SubCategory ID
  getProductsBySubCategory(subCategoryId: string): Observable<any[]> {
    const productsRef = collection(this.firestore, 'products');
    const q = query(
      productsRef,
      where('subcategoryId', '==', subCategoryId),
      where('isActive', '==', true)
    );
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }
}