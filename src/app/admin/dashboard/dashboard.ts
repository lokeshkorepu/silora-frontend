import { Component, OnInit } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { BaseChartDirective } from 'ng2-charts'; 
import { OrderService } from '../../core/services/order.service'; 
import { ChartConfiguration, Chart, registerables } from 'chart.js'; 
import { NotificationService } from '../../core/services/notification.service';
import { collection, addDoc, serverTimestamp } from '@angular/fire/firestore';

@Component({ 
selector: 'app-dashboard', 
standalone: true, 
imports: [CommonModule, BaseChartDirective], 
templateUrl: './dashboard.html', 
styleUrls: ['./dashboard.css'] 
}) 

export class DashboardComponent implements OnInit { 

/* ===== RAW VALUES ===== */ 
totalOrders = 0; 
totalRevenue = 0; 
delivered = 0; 
pending = 0; 

/* ===== ANIMATED VALUES ===== */ 
animatedTotalOrders = 0; 
animatedRevenue = 0; 
animatedDelivered = 0; 
animatedPending = 0; 
previousOrderCount = 0; 
recentOrders: any[] = []; 
expandedOrderId: string | null = null; 
selectedOrder: any = null; 
loading = true; 
isDarkMode = false; 

/* ========= LINE CHART ========= */ 
revenueChartData: ChartConfiguration<'line'>['data'] = { 
labels: [], 
datasets: [ { 
data: [], 
label: 'Revenue', 
fill: true, 
tension: 0.4 
} ] 
}; 

/* ========= DONUT CHART ========= */ 
statusChartData: ChartConfiguration<'doughnut'>['data'] = { 
labels: ['Delivered', 'Pending', 'Cancelled'], 
datasets: [ { data: [], } ] 
}; 

constructor(private orderService: OrderService,
            private notificationService: NotificationService
) { 

  Chart.register(...registerables); } 


ngOnInit() {

  this.orderService.getAllOrders().subscribe(async (orders) => {

    if (this.previousOrderCount && orders.length > this.previousOrderCount) {

      const newOrders = orders.slice(0, orders.length - this.previousOrderCount);

      for (const o of newOrders) {

        const notificationsRef = collection(
          this.orderService['firestore'],
          'adminNotifications'
        );

        await addDoc(notificationsRef, {
          type: 'NEW_ORDER',
          orderId: o.docId,
          message: `New order from ${o.userEmail}`,
          createdAt: serverTimestamp(),
          readBy: []
        });

      }
    }

    this.previousOrderCount = orders.length;

    /* ===== Dashboard Stats ===== */
    this.totalOrders = orders.length;
    this.totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    this.delivered = orders.filter(o => o.status === 'DELIVERED').length;
    this.pending = orders.filter(o => o.status === 'PENDING').length;
    this.recentOrders = orders.slice(0, 5);

    this.prepareCharts(orders);

    this.animateValue(this.totalOrders, val => this.animatedTotalOrders = val);
    this.animateValue(this.totalRevenue, val => this.animatedRevenue = val);
    this.animateValue(this.delivered, val => this.animatedDelivered = val);
    this.animateValue(this.pending, val => this.animatedPending = val);

    this.loading = false;
  });
}


 /* ========================= COUNTER ANIMATION ========================== */ 

animateValue(finalValue: number, setter: (val: number) => void) { 
let current = 0; 
const increment = finalValue / 30; 
const interval = setInterval(() => { current += increment; if (current >= finalValue) { setter(finalValue); clearInterval(interval); } 

else { setter(Math.floor(current)); 
} 
}, 20); 
} 

/* ========================= CHART PREPARATION ========================== */ 

prepareCharts(orders: any[]) { 
const last7Days: string[] = []; 
const revenueData: number[] = []; 
for (let i = 6; i >= 0; i--) 
{ 
const date = new Date(); 
date.setDate(date.getDate() - i); 
const formatted = date.toLocaleDateString(); 
last7Days.push(formatted); 
const dailyRevenue = orders 
.filter(o => { const orderDate = o.createdAt?.toDate?.(); return orderDate?.toLocaleDateString() === formatted; })
 .reduce((sum, o) => sum + o.totalAmount, 0); revenueData.push(dailyRevenue); } 

this.revenueChartData.labels = last7Days; 
this.revenueChartData.datasets[0].data = revenueData; 
const cancelled = orders.filter(o => o.status === 'CANCELLED').length; 
this.statusChartData.datasets[0].data = [ this.delivered, this.pending, cancelled ]; } 

/* ========================= ROW EXPAND ========================== */ 

toggleExpand(orderId: string) 
{ 
this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId; } 

/* ========================= MODAL ========================== */ 

openModal(order: any) { this.selectedOrder = order; } 
closeModal() { this.selectedOrder = null; } 

/* ========================= DARK MODE ========================== */ 
toggleDarkMode() { this.isDarkMode = !this.isDarkMode; document.body.classList.toggle('dark-mode'); } 

/* ========================= CSV EXPORT ========================== */ 
exportCSV() { const rows = this.recentOrders.map(o => [ o.id, o.userEmail, o.totalAmount, o.status ]); 
const csvContent = "data:text/csv;charset=utf-8," + ["Order ID,Customer,Amount,Status"] .concat(rows.map(e => e.join(","))) .join("\n"); 
const encodedUri = encodeURI(csvContent); 
const link = document.createElement("a"); 
link.setAttribute("href", encodedUri); 
link.setAttribute("download", "orders.csv"); 
document.body.appendChild(link); link.click(); 
}

 /* ========================= SIMPLE TOAST ========================== */ 
showToast(message: string) 
{
 alert(message);
 }
 }
