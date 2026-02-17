import { Injectable, inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  orderBy,
  doc,
  updateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export interface AdminNotification {
  id?: string;
  type: string;
  orderId: string;
  message: string;
  createdAt: any;
  readBy: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationService {

  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private injector = inject(EnvironmentInjector);

  getNotifications(): Observable<AdminNotification[]> {

    return runInInjectionContext(this.injector, () => {
      const ref = collection(this.firestore, 'adminNotifications');
      const q = query(ref, orderBy('createdAt', 'desc'));
      return collectionData(q, { idField: 'id' }) as Observable<AdminNotification[]>;
    });

  }

  async markAsRead(notification: any) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const ref = doc(this.firestore, `adminNotifications/${notification.id}`);
    const updatedReadBy = notification.readBy || [];

    if (!updatedReadBy.includes(user.uid)) {
      updatedReadBy.push(user.uid);
      await updateDoc(ref, { readBy: updatedReadBy });
    }
  }
}
