import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { Order } from '../models/order.model';
import { OrderDTO } from '../dto/order.dto';
import { OrderMapper } from '../mappers/order.mapper';
import { ApiService } from './api.service';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {

  constructor(private api: ApiService) {}

  /* =========================
     PUBLIC API (UI USES THIS)
  ========================== */

  getOrders(): Observable<Order[]> {
    return this.api.getOrders().pipe(
      map(dtos => dtos.map(dto => OrderMapper.fromDTO(dto)))
    );
  }

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

    return this.api.saveOrder(newOrderDTO);
  }

  updateOrder(order: Order): Observable<void> {
    const status =
      order.status === 'Delivered' ? 'DELIVERED' :
      order.status === 'Cancelled' ? 'CANCELLED' :
      'RETURNED';

    return this.api.updateOrderStatus(order.id, status);
  }
}
