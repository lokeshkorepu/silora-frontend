import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL
} from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  // ✅ GET PRODUCTS (for Home page)
  getProducts(): Observable<Product[]> {
    const refCol = collection(this.firestore, 'products');
    return collectionData(refCol, { idField: 'id' }).pipe(
      map(data => data as Product[])
    );
  }

  // ✅ ADD PRODUCT (Admin)
  addProduct(product: any) {
    const refCol = collection(this.firestore, 'products');
    return addDoc(refCol, product);
  }

  // ✅ UPLOAD IMAGE (Firebase Storage)
  async uploadImage(file: File): Promise<string> {
    const filePath = `products/${Date.now()}_${file.name}`;
    const fileRef = ref(this.storage, filePath);

    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  }
}
