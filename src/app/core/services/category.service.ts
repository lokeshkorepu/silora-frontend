import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { doc, docData } from '@angular/fire/firestore';
import { updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(
    private firestore: Firestore,
    private storage: Storage
  ) {}

  /* GET ALL CATEGORIES (REALTIME) */
  getCategories(): Observable<any[]> {
    const categoryRef = collection(this.firestore, 'categories');
    return collectionData(categoryRef, { idField: 'id' }) as Observable<any[]>;
  }

  getCategoryById(id: string) {
  const docRef = doc(this.firestore, `categories/${id}`);
  return docData(docRef, { idField: 'id' });
}

  /* ADD CATEGORY */
  async addCategory(name: string, file: File) {

    const storageRef = ref(this.storage, `categories/${Date.now()}_${file.name}`);

    // Upload image
    await uploadBytes(storageRef, file);

    // Get image URL
    const imageUrl = await getDownloadURL(storageRef);

    // Save to Firestore
    const categoryRef = collection(this.firestore, 'categories');

    await addDoc(categoryRef, {
      name,
      imageUrl,
      createdAt: new Date()
    });
  }
  async updateCategory(id: string, name: string, file?: File | null) {

  const firestoreRef = doc(this.firestore, `categories/${id}`);

  let data: any = { name };

  // If new image selected → upload new image
  if (file) {

    const storageRef = ref(this.storage, `categories/${file.name}`);
    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    data.imageUrl = imageUrl;
  }

  await updateDoc(firestoreRef, data);
}
}
