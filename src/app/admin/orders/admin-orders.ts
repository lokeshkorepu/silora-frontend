import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';

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

  constructor(private orderService: OrderService,
              public notificationService: NotificationService
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
}
