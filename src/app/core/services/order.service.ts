import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { OrderDTO } from '../dto/order.dto';
import { OrderMapper } from '../mappers/order.mapper';
import { ApiService } from './api.service';
import { Observable, from, map, tap } from 'rxjs';

import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class OrderService {

  private readonly STORAGE_KEY = 'orders';

  constructor(
    private api: ApiService,
    private firestore: Firestore
  ) {}

  /* =========================
     GET ORDERS (UI USES THIS)
  ========================== */

  getOrders(): Observable<Order[]> {
    return this.api.getOrders().pipe(
      map(dtos => dtos.map(dto => OrderMapper.fromDTO(dto)))
    );
  }

  /* =========================
     SAVE ORDER (DUAL WRITE)
     - Firestore (real backend)
     - localStorage (fallback)
     - API (existing flow)
  ========================== */

  saveOrder(items: Product[], total: number): Observable<void> {
    const newOrderDTO: OrderDTO = {
      id: 'ORD-' + Date.now(),
      createdAt: new Date().toISOString(),
      totalAmount: total,
      status: 'DELIVERED',
      items: items.map(item => ({
        productId: item.id,
        price: item.price,
        quantity: Number(item.quantity) || 1
      }))
    };

    // 1️⃣ Save to Firestore (Promise → Observable)
    const firestore$ = from(
      addDoc(collection(this.firestore, 'orders'), {
        ...newOrderDTO,
        createdAt: new Date()
      })
    );

    // 2️⃣ Save to API (existing behavior)
    const api$ = this.api.saveOrder(newOrderDTO);

    // 3️⃣ Save to localStorage (fallback)
    return firestore$.pipe(
      tap(() => this.saveToLocalStorage(newOrderDTO)),
      map(() => void 0),
      tap(() => {
        api$.subscribe(); // keep existing backend in sync
      })
    );
  }

  /* =========================
     UPDATE ORDER STATUS
  ========================== */

  updateOrder(order: Order): Observable<void> {
    const status =
      order.status === 'Delivered' ? 'DELIVERED' :
      order.status === 'Cancelled' ? 'CANCELLED' :
      'RETURNED';

    return this.api.updateOrderStatus(order.id, status);
  }

  /* =========================
     LOCAL STORAGE (FALLBACK)
  ========================== */

  private saveToLocalStorage(order: OrderDTO) {
    const existing = JSON.parse(
      localStorage.getItem(this.STORAGE_KEY) || '[]'
    );
    existing.push(order);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
  }
}
