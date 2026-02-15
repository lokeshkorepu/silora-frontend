import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { OrderService } from '../../core/services/order.service';
import { ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  totalOrders = 0;
  totalRevenue = 0;
  delivered = 0;
  pending = 0;

  recentOrders: any[] = [];
  expandedOrderId: string | null = null;
  selectedOrder: any = null;
  loading = true;


  /* ========= LINE CHART ========= */
  revenueChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Revenue',
        fill: true,
        tension: 0.4
      }
    ]
  };

  /* ========= DONUT CHART ========= */
  statusChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Delivered', 'Pending', 'Cancelled'],
    datasets: [
      {
        data: [],
      }
    ]
  };

constructor(private orderService: OrderService) {
    Chart.register(...registerables);  // ✅ Fix here
  }

  ngOnInit() {

    this.orderService.getAllOrders().subscribe(orders => {

      this.totalOrders = orders.length;
      this.totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

      this.delivered = orders.filter(o => o.status === 'DELIVERED').length;
      this.pending = orders.filter(o => o.status === 'PENDING').length;

      this.recentOrders = orders.slice(0, 5);

      this.prepareCharts(orders);

      this.loading = false;
    });
  }

  prepareCharts(orders: any[]) {

    /* ==== Revenue Last 7 Days ==== */
    const last7Days = [];
    const revenueData = [];

    for (let i = 6; i >= 0; i--) {

      const date = new Date();
      date.setDate(date.getDate() - i);

      const formatted = date.toLocaleDateString();
      last7Days.push(formatted);

      const dailyRevenue = orders
        .filter(o => {
          const orderDate = o.createdAt?.toDate?.();
          return orderDate?.toLocaleDateString() === formatted;
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);

      revenueData.push(dailyRevenue);
    }

    this.revenueChartData.labels = last7Days;
    this.revenueChartData.datasets[0].data = revenueData;

    /* ==== Donut Chart ==== */
    const cancelled = orders.filter(o => o.status === 'CANCELLED').length;

    this.statusChartData.datasets[0].data = [
      this.delivered,
      this.pending,
      cancelled
    ];
  }

  toggleExpand(orderId: string) {
  this.expandedOrderId =
    this.expandedOrderId === orderId ? null : orderId;
}


openModal(order: any) {
  this.selectedOrder = order;
}

closeModal() {
  this.selectedOrder = null;
}

}
