import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { OrderDTO } from '../dto/order.dto';
import { ApiService } from './api.service';
import { Observable, from, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  collectionData,
  orderBy,
  doc,
  updateDoc
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(
    private api: ApiService,
    private firestore: Firestore,
    private authService: AuthService
  ) {}

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

    return collectionData(q, { idField: 'docId' });
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

    return collectionData(q, { idField: 'docId' });
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
      items: items
        .filter(item => !!item.id && typeof item.count === 'number')
        .map(item => ({
          productId: item.id as string,
          price: item.price,
          quantity: item.count as number
        }))
    };

    const firestore$ = from(
      addDoc(
        collection(this.firestore, 'orders'),
        {
          ...newOrderDTO,
          userId: user?.uid || null,
          userEmail: user?.email || null,
          createdAt: new Date()
        }
      )
    );

    return firestore$.pipe(
      map(() => void 0)
    );
  }

  /* =========================
     ADMIN UPDATE STATUS
  ========================== */
  updateOrderStatus(docId: string, status: string): Promise<void> {

    const orderRef = doc(this.firestore, `orders/${docId}`);

    return updateDoc(orderRef, { status });
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

}
