import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdminNotificationService } from '../../core/services/admin-notification.service';
import { AuthService } from '../../core/auth/auth.service';
import confetti from 'canvas-confetti';

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  writeBatch,
  Timestamp,
  Firestore
} from '@angular/fire/firestore';

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

  // Pagination
  pageSize = 100;
  totalOrders = 0;
  startIndex = 0;
  endIndex = 0;
  lastDoc: any = null;

  // Drawer
  selectedOrder: any = null;
  isDrawerOpen = false;
  isMobile = false;

  // Timeline
  timelineSteps: string[] = ['Placed', 'Packed', 'Shipped', 'Delivered'];

  // Toast
  showToast = false;
  statusMorph = false;

  constructor(
    private orderService: OrderService,
    public notificationService: NotificationService,
    public adminNotificationService: AdminNotificationService,
    public authService: AuthService,
    private firestore: Firestore
  ) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;
    this.loadOrders();
    this.listenForHighlights();
  }

  /* ================= LOAD ORDERS ================= */
  async loadOrders() {

    const result = await this.orderService.getOrdersPaginated(this.pageSize);

    this.orders = (result.orders as any[]).map((order: any) => ({
      docId: order.docId,
      id: order.id,
      date: order.createdAt?.toDate?.()
        ? order.createdAt.toDate()
        : order.createdAt,
      total: order.totalAmount,

      status: typeof order.status === 'string'
        ? this.formatStatus(order.status)
        : this.formatStatus(order.status?.status || order.status),

      packedAt: order.packedAt?.toDate ? order.packedAt.toDate() : order.packedAt,
      shippedAt: order.shippedAt?.toDate ? order.shippedAt.toDate() : order.shippedAt,
      deliveredAt: order.deliveredAt?.toDate ? order.deliveredAt.toDate() : order.deliveredAt,

      products: order.items || []
    }));

    this.totalOrders = result.totalCount;
    this.lastDoc = result.lastDoc;
    this.startIndex = 1;
    this.endIndex = this.orders.length;
    this.loading = false;
  }

  async changePageSize(size: number) {
    this.pageSize = size;
    this.startIndex = 0;
    this.endIndex = 0;
    this.lastDoc = null;
    await this.loadOrders();
  }

  /* ================= STATUS UPDATE ================= */
  async updateStatus(order: any) {

    const formattedStatus = order.status;
    const backendStatus = formattedStatus.toUpperCase();
    const now = new Date();

    const updateData: any = { status: backendStatus };

    if (backendStatus === 'PACKED') {
      updateData.packedAt = now;
    }

    if (backendStatus === 'SHIPPED') {
      updateData.packedAt = order.packedAt || now;
      updateData.shippedAt = now;
    }

    if (backendStatus === 'DELIVERED') {
      updateData.packedAt = order.packedAt || now;
      updateData.shippedAt = order.shippedAt || now;
      updateData.deliveredAt = now;
    }

    await this.orderService.updateOrderStatus(order.docId, updateData);

    order.status = this.formatStatus(backendStatus);

    if (updateData.packedAt) order.packedAt = updateData.packedAt;
    if (updateData.shippedAt) order.shippedAt = updateData.shippedAt;
    if (updateData.deliveredAt) order.deliveredAt = updateData.deliveredAt;

    // Sync drawer if open
    if (this.selectedOrder && this.selectedOrder.docId === order.docId) {
      this.selectedOrder.status = order.status;
      this.selectedOrder.packedAt = order.packedAt;
      this.selectedOrder.shippedAt = order.shippedAt;
      this.selectedOrder.deliveredAt = order.deliveredAt;
    }

    // 🔥 CRITICAL FIX: Sync main orders array
    const index = this.orders.findIndex(o => o.docId === order.docId);
    if (index !== -1) {
      this.orders[index] = { ...order };
    }

    this.triggerToast();

    this.statusMorph = true;
    setTimeout(() => this.statusMorph = false, 400);

    if (order.status === 'Delivered') {
      this.triggerConfetti();
    }
  }

  /* ================= STATUS FORMAT ================= */
  private formatStatus(status: string | any): string {
    if (!status) return 'Pending';

    if (typeof status === 'object' && status.status) {
      status = status.status;
    }

    if (typeof status !== 'string') return 'Pending';

    return status.charAt(0).toUpperCase() +
           status.slice(1).toLowerCase();
  }

  /* ================= FILTER ================= */
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

  trackByOrder(index: number, order: any): string {
    return order.docId;
  }

  /* ================= TOAST ================= */
  triggerToast() {
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  /* ================= HIGHLIGHT NEW ORDERS ================= */
  private listenForHighlights() {

    this.adminNotificationService.getNotifications()
      .subscribe(notifications => {

        const user = this.authService.getCurrentUser();
        if (!user) return;

        const unread = notifications.filter(n =>
          !n.readBy?.includes(user.uid)
        );

        unread.forEach(n => {

          if (!this.highlightedOrders.has(n.orderId)) {

            this.highlightedOrders.add(n.orderId);

            setTimeout(() => {
              this.highlightedOrders.delete(n.orderId);
            }, 5000);
          }
        });
      });
  }

  /* ================= CLEAN OLD ORDERS ================= */
  async cleanOldOrders() {

    const confirmDelete = confirm(
      "Are you sure you want to delete orders older than 7 days?"
    );
    if (!confirmDelete) return;

    const now = new Date();
    const sevenDaysAgoDate =
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sevenDaysAgo = Timestamp.fromDate(sevenDaysAgoDate);

    const ordersRef = collection(this.firestore, 'orders');

    const q = query(
      ordersRef,
      orderBy('createdAt'),
      where('createdAt', '<', sevenDaysAgo)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("No old orders found.");
      return;
    }

    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    alert(`Deleted ${snapshot.size} old orders.`);
    await this.loadOrders();
  }

  /* ================= DRAWER ================= */
  async openDrawer(order: any) {

    document.body.style.overflow = 'hidden';

    this.selectedOrder = { ...order, products: [] };
    this.isDrawerOpen = true;

    for (let item of order.products) {

      const productDoc =
        await this.orderService.getProductById(item.productId);

      this.selectedOrder.products.push({
        ...item,
        name: productDoc?.name || 'Unknown Product',
        image: productDoc?.image || null
      });
    }
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    document.body.style.overflow = 'auto';

    setTimeout(() => {
      this.selectedOrder = null;
    }, 300);
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    }
  }

  /* ================= TIMELINE ================= */
  getCurrentStepIndex(status: string): number {
    return this.timelineSteps.indexOf(status);
  }

  getTimelineProgress(status: string): number {
    const index = this.getCurrentStepIndex(status);
    return (index / (this.timelineSteps.length - 1)) * 100;
  }

  getStepTime(step: string): string {

    if (!this.selectedOrder) return '—';

    switch (step) {

      case 'Placed':
        return this.selectedOrder.date
          ? new Date(this.selectedOrder.date).toLocaleString()
          : '—';

      case 'Packed':
        return this.selectedOrder.packedAt
          ? new Date(this.selectedOrder.packedAt).toLocaleString()
          : (this.getCurrentStepIndex(this.selectedOrder.status) > 0 ? 'Completed' : '—');

      case 'Shipped':
        return this.selectedOrder.shippedAt
          ? new Date(this.selectedOrder.shippedAt).toLocaleString()
          : (this.getCurrentStepIndex(this.selectedOrder.status) > 1 ? 'Completed' : '—');

      case 'Delivered':
        return this.selectedOrder.deliveredAt
          ? new Date(this.selectedOrder.deliveredAt).toLocaleString()
          : (this.getCurrentStepIndex(this.selectedOrder.status) > 2 ? 'Completed' : '—');

      default:
        return '—';
    }
  }

  /* ================= CONFETTI ================= */
  triggerConfetti() {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  /* ================= NEXT STATUS ================= */
  get nextStatus(): string | null {

    if (!this.selectedOrder) return null;

    switch (this.selectedOrder.status) {
      case 'Placed': return 'Packed';
      case 'Packed': return 'Shipped';
      case 'Shipped': return 'Delivered';
      default: return null;
    }
  }

  @HostListener('window:resize')
onResize() {
  this.isMobile = window.innerWidth <= 768;
}
}