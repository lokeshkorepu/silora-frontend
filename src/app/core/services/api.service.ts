import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { OrderDTO } from '../dto/order.dto';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private STORAGE_KEY = 'orders';

  getOrders(): Observable<OrderDTO[]> {
    const data = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    return of(data).pipe(delay(800)); // ⏳ simulate network
  }

  saveOrder(order: OrderDTO): Observable<void> {
    const orders = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    orders.unshift(order);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    return of(void 0).pipe(delay(500));
  }

  updateOrderStatus(id: string, status: OrderDTO['status']): Observable<void> {
    const orders = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    const index = orders.findIndex((o: OrderDTO) => o.id === id);
    if (index !== -1) {
      orders[index].status = status;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    }
    return of(void 0).pipe(delay(400));
  }
}
