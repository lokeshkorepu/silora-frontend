import { Routes } from '@angular/router';
import { HomeComponent } from './user/home/home';
import { LoginComponent } from './auth/login/login';
import { CartComponent } from './user/cart/cart';
import { OrdersComponent } from './user/orders/orders';
import { DashboardComponent } from './admin/dashboard/dashboard';
import { CheckoutComponent } from './user/checkout/checkout';
import { OrderSuccess } from './user/order-success/order-success';

export const routes: Routes = [
  // Default route
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // User routes
  { path: 'home', component: HomeComponent },
  { path: 'cart', component: CartComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'success', component: OrderSuccess },


  // Auth routes
  { path: 'login', component: LoginComponent },

  // Admin routes
  { path: 'admin', component: DashboardComponent },

  // Wildcard (ALWAYS keep this last)
  { path: '**', redirectTo: 'home' }
];
