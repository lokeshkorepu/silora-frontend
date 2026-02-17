import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { AdminNotification, AdminNotificationService } from '../../core/services/admin-notification.service';
import { AuthService } from '../../core/auth/auth.service';
@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrls: ['./admin-orders.css']
})
export class AdminOrdersComponent implements OnInit {

  orders: any[] = [];
  loading = true;
  selectedStatus: string = 'All';
  searchTerm: string = '';
  highlightedOrders: Set<string> = new Set();


  constructor(private orderService: OrderService,
              public notificationService: NotificationService,
              public adminNotificationService: AdminNotificationService,
              public authService: AuthService
  ) {}

 ngOnInit(): void {

  // 🔥 Real-time Firestore Orders
  this.orderService.getAllOrders().subscribe({
    next: (data) => {

      // Map Firestore data → Your UI format
      this.orders = data.map(order => ({
        docId: order.docId,
        id: order.id,
        date: order.createdAt?.toDate?.()
          ? order.createdAt.toDate()
          : order.createdAt,
        total: order.totalAmount,
        status: this.formatStatus(order.status)
      }));

      this.loading = false;
    },
    error: () => {
      this.loading = false;
    }
  });

  /* ===============================
     🔥 STEP 4 – GREEN HIGHLIGHT
  ================================ */

  this.adminNotificationService.getNotifications().subscribe(notifications => {

    const user = this.authService.getCurrentUser();
    if (!user) return;

    const unread = notifications.filter(n =>
      !n.readBy?.includes(user.uid)
    );

    unread.forEach(n => {

      if (!this.highlightedOrders.has(n.orderId)) {

        this.highlightedOrders.add(n.orderId);

        // Remove highlight after 5 seconds
        setTimeout(() => {
          this.highlightedOrders.delete(n.orderId);
        }, 5000);
      }

    });

  });

}


  /* =============================
     STATUS UPDATE (Firestore)
  ============================== */
  updateStatus(order: any) {

    const firestoreStatus = order.status.toUpperCase();

    this.orderService
      .updateOrderStatus(order.docId, firestoreStatus)
      .catch(err => console.error(err));
  }

  /* =============================
     STATUS FORMATTER
  ============================== */
  private formatStatus(status: string): string {

    if (!status) return 'Pending';

    return status.charAt(0).toUpperCase() +
           status.slice(1).toLowerCase();
  }

  /* =============================
     FILTER + SEARCH
  ============================== */
  get filteredOrders() {

    return this.orders.filter(order => {

      const matchesStatus =
        this.selectedStatus === 'All' ||
        order.status === this.selectedStatus;

      const matchesSearch =
        !this.searchTerm ||
        order.id.toLowerCase()
          .includes(this.searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }

  isNewOrder(orderId: string, notifications: any[]): boolean {

  const user = this.authService.getCurrentUser();
  if (!user) return false;

  const match = notifications.find(n =>
    n.orderId === orderId &&
    !n.readBy?.includes(user.uid)
  );

  return !!match;
}

}
