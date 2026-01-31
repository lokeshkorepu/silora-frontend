import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';

import { OrderDetailsDialogComponent } from './order-details.dialog';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent implements OnInit {

  orders: Order[] = [];

  loading = true;
  error = false;

  pageSize = 3;
  currentPage = 1;
  pagedOrders: Order[] = [];
  totalPages = 0;
  pages: number[] = [];

  searchText = '';
  statusFilter = '';

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.orderService.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.setupPagination();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    if (this.searchText) {
      filtered = filtered.filter(o =>
        o.id.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(o => o.status === this.statusFilter);
    }

    this.orders = filtered;
    this.setupPagination();
  }

  setupPagination(): void {
    this.totalPages = Math.ceil(this.orders.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.applyPagination();
  }

  applyPagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedOrders = this.orders.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.applyPagination();
  }

  confirmReorder(order: Order): void {
    this.cartService.clearCart();

    order.items.forEach(item => {
      this.cartService.addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: String(item.quantity),
        image: item.image || '',
        category: item.category || 'reorder'
      });
    });

    this.snackBar.open('Items added to cart', 'View Cart', {
      duration: 3000
    }).onAction().subscribe(() => {
      this.router.navigate(['/cart']);
    });
  }

  openDetails(order: Order): void {
    this.dialog.open(OrderDetailsDialogComponent, {
      width: '600px',
      data: order
    });
  }

  cancelOrder(order: Order): void {
    order.status = 'Returned';
    this.orderService.updateOrder(order).subscribe(() => {
      this.snackBar.open('Order marked as Returned', '', { duration: 3000 });
    });
  }
}
