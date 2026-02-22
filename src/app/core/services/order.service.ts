import { Injectable, inject } from '@angular/core';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { OrderDTO } from '../dto/order.dto';
import { ApiService } from './api.service';
import { Observable, from, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { serverTimestamp } from '@angular/fire/firestore';
import { runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { ProductService } from './product.service';
import { switchMap } from 'rxjs';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  collectionData,
  orderBy,
  doc,
  updateDoc,
  docData,
  limit,
  startAfter,
  getDoc,
  getDocs,
  getCountFromServer 
} from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class OrderService {

  // ✅ Angular 20 recommended injection pattern
  private firestore = inject(Firestore);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private injector = inject(EnvironmentInjector);
  private productService = inject(ProductService);


  /* =========================
     USER ORDERS (Firestore)
  ========================== */
  getOrders(): Observable<any[]> {

    const user = this.authService.getCurrentUser();

    if (!user?.uid) {
      return of([]);
    }

    const ordersRef = collection(this.firestore, 'orders');

    const q = query(
      ordersRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

      return runInInjectionContext(this.injector, () =>
             collectionData(q, { idField: 'docId' })
);
  }

  /* =========================
     ADMIN REAL-TIME ORDERS
  ========================== */
  getAllOrders(): Observable<any[]> {

    const ordersRef = collection(this.firestore, 'orders');

    const q = query(
      ordersRef,
      orderBy('createdAt', 'desc')
    );

    return runInInjectionContext(this.injector, () =>
           collectionData(q, { idField: 'docId' })
);

  }

  /* =========================
     SAVE ORDER (Firestore)
  ========================== */
  saveOrder(items: Product[], total: number): Observable<void> {

  const user = this.authService.getCurrentUser();

  const newOrderDTO: OrderDTO = {
    id: 'ORD-' + Date.now(),
    createdAt: new Date().toISOString(),
    totalAmount: total,
    status: 'DELIVERED',
    items: items.map(item => ({
      productId: item.id as string,
      price: item.price,
      quantity: item.count as number
    }))
  };

  const ordersRef = collection(this.firestore, 'orders');

  return from(
    addDoc(ordersRef, {
      ...newOrderDTO,
      userId: user?.uid || null,
      userEmail: user?.email || null,
      createdAt: serverTimestamp()
    })
  ).pipe(
    switchMap(async () => {

      for (const item of items) {

        if (!item.id) continue;

        const unitWeight = parseInt(item.quantity || '0');
        const orderedQty = item.count || 0;

        const deduction = unitWeight * orderedQty;

        const newStock = (item.stockQuantity || 0) - deduction;

        await updateDoc(
          doc(this.firestore, `products/${item.id}`),
          { stockQuantity: newStock }
        );
      }

      return;
    })
  );
}


  /* =========================
     ADMIN UPDATE STATUS
  ========================== */
updateOrderStatus(docId: string, data: any) {
  const orderRef = doc(this.firestore, `orders/${docId}`);
  return updateDoc(orderRef, data);
}

  /* =========================
     BACKEND SYNC (Optional)
  ========================== */
  updateOrder(order: Order): Observable<void> {

    const status =
      order.status === 'Delivered' ? 'DELIVERED' :
      order.status === 'Cancelled' ? 'CANCELLED' :
      'RETURNED';

    return this.api.updateOrderStatus(order.id, status);
  }

getOrderProducts(orderDocId: string) {

  const productsRef = collection(
    doc(this.firestore, `orders/${orderDocId}`),
    'products'
  );

  return collectionData(productsRef, { idField: 'id' });
}

async getProductById(productId: string): Promise<any> {

  const productRef = doc(this.firestore, `products/${productId}`);
  const productSnap = await getDoc(productRef);

  if (productSnap.exists()) {
    return productSnap.data();
  }

  return null;
}

async getOrdersPaginated(pageSize: number, lastDoc: any = null) {

  const ordersRef = collection(this.firestore, 'orders');

  let q;

  if (lastDoc) {
    q = query(
      ordersRef,
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  } else {
    q = query(
      ordersRef,
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
  }

  const snapshot = await getDocs(q);

  const countSnapshot = await getCountFromServer(ordersRef);

  return {
    orders: snapshot.docs.map(doc => ({
  docId: doc.id,
  ...(doc.data() as any)
})),
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    totalCount: countSnapshot.data().count
  };
}

}
