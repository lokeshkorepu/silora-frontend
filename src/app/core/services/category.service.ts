import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs
} from '@angular/fire/firestore';

import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from '@angular/fire/storage';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  /* =========================================
     GET ALL CATEGORIES (Realtime)
  ========================================== */
  getAllCategories(): Observable<any[]> {

    const categoriesRef = collection(this.firestore, 'categories');

    const q = query(
      categoriesRef,
      orderBy('createdAt', 'desc')
    );

    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  getCategories(): Observable<any[]> {
  return this.getAllCategories();
}

  /* =========================================
     GET CATEGORY BY ID
  ========================================== */
  getCategoryById(id: string) {

    const docRef = doc(this.firestore, `categories/${id}`);

    return docData(docRef, { idField: 'id' });
  }

  /* =========================================
     GET MAIN CATEGORIES (parentId == null)
  ========================================== */
  getMainCategories(): Observable<any[]> {

    const categoriesRef = collection(this.firestore, 'categories');

    const q = query(
      categoriesRef,
      where('parentId', '==', null),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );

    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  /* =========================================
     GET SUBCATEGORIES BY PARENT ID
  ========================================== */
  getSubcategories(parentId: string): Observable<any[]> {

    const categoriesRef = collection(this.firestore, 'categories');

    const q = query(
      categoriesRef,
      where('parentId', '==', parentId),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );

    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  /* =========================================
     GET ALL SUBCATEGORIES
  ========================================== */
  getAllSubCategories(): Observable<any[]> {

  const categoriesRef = collection(this.firestore, 'categories');

  const q = query(
    categoriesRef,
    where('parentId', '!=', null),
    orderBy('parentId'),
    orderBy('order')
  );

  return collectionData(q, { idField: 'id' }) as Observable<any[]>;
}

  /* =========================================
     ADD CATEGORY
  ========================================== */
  async addCategory(
    name: string,
    file: File,
    parentId: string | null,
    descriptionHTML?: string
  ) {

    const storageRef = ref(
      this.storage,
      `categories/${Date.now()}_${file.name}`
    );

    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    await addDoc(collection(this.firestore, 'categories'), {
      name,
      imageUrl,
      parentId: parentId ?? null,
      order: await this.getNextOrder(parentId),
      isActive: true,
      descriptionHTML,
      createdAt: new Date()
    });
  }

  /* =========================================
     UPDATE CATEGORY
  ========================================== */
  async updateCategory(
    id: string,
    name: string,
    file?: File | null,
    parentId?: string | null,
    descriptionHTML?: string
  ) {

    const docRef = doc(this.firestore, `categories/${id}`);

    let updateData: any = {
      name,
      parentId: parentId ?? null,
      descriptionHTML: descriptionHTML || ''
    };

    if (file) {

      const storageRef = ref(
        this.storage,
        `categories/${Date.now()}_${file.name}`
      );

      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      updateData.imageUrl = imageUrl;
    }

    await updateDoc(docRef, updateData);
  }

  /* =========================================
     SAFE DELETE CATEGORY
  ========================================== */
  async deleteCategorySafe(category: any) {

    const categoriesRef = collection(this.firestore, 'categories');

    // Check if subcategories exist
    const childQuery = query(
      categoriesRef,
      where('parentId', '==', category.id)
    );

    const childSnapshot = await getDocs(childQuery);

    if (!childSnapshot.empty) {
      throw new Error('Cannot delete: This category has subcategories.');
    }

    // Delete image from storage
    if (category.imageUrl) {
      const imageRef = ref(this.storage, category.imageUrl);
      await deleteObject(imageRef);
    }

    // Delete document
    await deleteDoc(
      doc(this.firestore, 'categories', category.id)
    );

    // Reorder siblings
    await this.reorderCategories(category.parentId);
  }

  /* =========================================
     GET NEXT ORDER
  ========================================== */
  private async getNextOrder(parentId: string | null): Promise<number> {

    const categoriesRef = collection(this.firestore, 'categories');

    const q = query(
      categoriesRef,
      where('parentId', '==', parentId ?? null),
      orderBy('order', 'desc')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return 1;

    const lastOrder = snapshot.docs[0].data()['order'] || 0;

    return lastOrder + 1;
  }

  /* =========================================
     REORDER SIBLINGS
  ========================================== */
  private async reorderCategories(parentId: string | null) {

    const categoriesRef = collection(this.firestore, 'categories');

    const q = query(
      categoriesRef,
      where('parentId', '==', parentId ?? null),
      orderBy('order')
    );

    const snapshot = await getDocs(q);

    let newOrder = 1;

    const updates: Promise<any>[] = [];

    snapshot.docs.forEach(docSnap => {

      updates.push(
        updateDoc(
          doc(this.firestore, 'categories', docSnap.id),
          { order: newOrder++ }
        )
      );
    });

    await Promise.all(updates);
  }
}
