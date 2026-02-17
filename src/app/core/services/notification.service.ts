import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AdminNotification {
  id: string;
  message: string;
  orderId: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private _notifications = new BehaviorSubject<AdminNotification[]>([]);
  notifications$ = this._notifications.asObservable();

  private _count = new BehaviorSubject<number>(0);
  count$ = this._count.asObservable();

  private _toast = new BehaviorSubject<string | null>(null);
  toast$ = this._toast.asObservable();

  private _newOrderIds = new BehaviorSubject<Set<string>>(new Set());
  newOrderIds$ = this._newOrderIds.asObservable();

  addNewOrderId(id: string) {
  const updated = new Set(this._newOrderIds.value);
  updated.add(id);
  this._newOrderIds.next(updated);

  // Auto remove after 5 sec
  setTimeout(() => {
    const removeSet = new Set(this._newOrderIds.value);
    removeSet.delete(id);
    this._newOrderIds.next(removeSet);
  }, 5000);
}

  add(notification: AdminNotification) {
    const current = this._notifications.value;
    const updated = [notification, ...current].slice(0, 20);

    this._notifications.next(updated);

    const unread = updated.filter(n => !n.read).length;
    this._count.next(unread);
  }
    
  showToast(message: string) {
    this._toast.next(message);
    setTimeout(() => this._toast.next(null), 4000);
  }

  remove(id: string) {
  const updated = this._notifications.value.filter(n => n.id !== id);
  this._notifications.next(updated);

  const unread = updated.filter(n => !n.read).length;
  this._count.next(unread);
}

}
