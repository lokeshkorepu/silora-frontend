import { Routes } from '@angular/router';

import { HomeComponent } from './user/home/home';
import { LoginComponent } from './auth/login/login';
import { CartComponent } from './user/cart/cart';
import { CheckoutComponent } from './user/checkout/checkout';
import { OrderSuccess } from './user/order-success/order-success';
import { DashboardComponent } from './admin/dashboard/dashboard';

import { AuthGuard } from './core/auth/auth.guard';
import { AdminGuard } from './core/auth/admin.guard';

export const routes: Routes = [

  /* =========================
     DEFAULT ROUTE
  ========================== */
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  /* =========================
     USER ROUTES
  ========================== */
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'cart',
    component: CartComponent
  },
  {
    path: 'orders',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./user/orders/orders')
        .then(m => m.OrdersComponent)
  },
  {
    path: 'checkout',
    canActivate: [AuthGuard],
    component: CheckoutComponent
  },
  {
    path: 'success',
    canActivate: [AuthGuard],
    component: OrderSuccess
  },

  /* =========================
     AUTH ROUTES
  ========================== */
  {
    path: 'login',
    component: LoginComponent
  },

  /* =========================
     ADMIN ROUTES
  ========================== */
  {
    path: 'admin',
    canActivate: [AdminGuard],
    component: DashboardComponent
  },
  {
    path: 'admin/orders',
    canActivate: [AdminGuard],
    loadComponent: () =>
      import('./admin/orders/admin-orders')
        .then(m => m.AdminOrdersComponent)
  },

  /* =========================
     FALLBACK
  ========================== */
  {
    path: '**',
    redirectTo: 'home'
  }
];
