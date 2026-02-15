import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  collection,
  collectionData,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  docData
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  /* =========================
     GET PRODUCTS (REAL-TIME)
  ========================== */
  getProducts(): Observable<Product[]> {
    const productsRef = collection(this.firestore, 'products');
    return collectionData(productsRef, { idField: 'id' }) as Observable<Product[]>;
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
    await updateDoc(productRef, data);
  }

}
