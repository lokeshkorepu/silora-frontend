import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-order-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>Order Details</h2>

    <mat-dialog-content>
      <p><b>Order ID:</b> {{ data.id }}</p>
      <p><b>Date:</b> {{ data.date | date:'medium' }}</p>
      <p><b>Total:</b> ₹{{ data.total }}</p>

      <table class="order-items">
        <tr *ngFor="let item of data.items">
          <td>{{ item.name }}</td>
          <td>× {{ item.quantity }}</td>
          <td>₹{{ item.price * item.quantity }}</td>
        </tr>
      </table>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .order-items {
      width: 100%;
      margin-top: 12px;
      border-collapse: collapse;
    }
    .order-items td {
      padding: 6px;
      border-bottom: 1px solid #eee;
    }
  `]
})
export class OrderDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: Order) {}
}
