import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  collection,
  collectionData,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  docData,
  query,
  where
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { 
  orderBy,
  startAt,
  endAt,
  limit
} from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  /* =========================
     GET ALL PRODUCTS
  ========================== */
  getProducts(): Observable<Product[]> {
    const productsRef = collection(this.firestore, 'products');
    return collectionData(productsRef, { idField: 'id' }) as Observable<Product[]>;
  }

  /* =========================
     GET PRODUCTS BY CATEGORY
  ========================== */
  getProductsByCategory(category: string): Observable<Product[]> {
    const productsRef = collection(this.firestore, 'products');
    const q = query(productsRef, where('category', '==', category));
    return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
  }

  /* =========================
     ADD PRODUCT
  ========================== */
  async addProduct(product: any, file: File): Promise<void> {

    const storageRef = ref(this.storage, `products/${Date.now()}_${file.name}`);

    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    const productsRef = collection(this.firestore, 'products');

    await addDoc(productsRef, {
      ...product,
      nameLower: product.name.toLowerCase(),   // 👈 required
      imageUrl,
      createdAt: new Date()
    });
  }

  /* =========================
     DELETE PRODUCT
  ========================== */
  async deleteProduct(id: string): Promise<void> {
    const productRef = doc(this.firestore, 'products', id);
    await deleteDoc(productRef);
  }

  /* =========================
     GET PRODUCT BY ID
  ========================== */
  getProductById(id: string): Observable<Product | undefined> {
    const productRef = doc(this.firestore, 'products', id);
    return docData(productRef, { idField: 'id' }) as Observable<Product>;
  }

  /* =========================
     UPDATE PRODUCT
  ========================== */
  async updateProduct(id: string, data: any): Promise<void> {
    const productRef = doc(this.firestore, 'products', id);
      await updateDoc(productRef, {
           ...data,
           nameLower: data.name?.toLowerCase()
  });  
}

  /* =========================
   SEARCH PRODUCTS BY NAME
========================== */
searchProducts(searchTerm: string): Observable<Product[]> {

  const productsRef = collection(this.firestore, 'products');

  const q = query(
    productsRef,
    orderBy('name'),
    startAt(searchTerm),
    endAt(searchTerm + '\uf8ff')
  );

  return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
}

getFilteredProducts(
  category: string,
  pageSize: number
): Observable<Product[]> {

  const productsRef = collection(this.firestore, 'products');

  let constraints: any[] = [];

  if (category) {
    constraints.push(where('category', '==', category));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(pageSize));

  const q = query(productsRef, ...constraints);

  return collectionData(q, { idField: 'id' }) as Observable<Product[]>;
}



}
