import { Routes } from '@angular/router';

import { HomeComponent } from './user/home/home';
import { LoginComponent } from './auth/login/login';
import { CartComponent } from './user/cart/cart';
import { CheckoutComponent } from './user/checkout/checkout';
import { OrderSuccess } from './user/order-success/order-success';
import { DashboardComponent } from './admin/dashboard/dashboard';
import { AdminOrdersComponent } from './admin/orders/admin-orders';
import { AddProductComponent } from './admin/add-product/add-product';


import { AuthGuard } from './core/auth/auth.guard';
import { AdminGuard } from './core/auth/admin.guard';

export const routes: Routes = [

  /* =========================
     DEFAULT ROUTE
  ========================== */
    {
  path: '',
  loadComponent: () =>
    import('./user/home/home')
      .then(m => m.HomeComponent)
},

  /* =========================
     USER ROUTES
  ========================== */
//   {
//   path: 'home',
//   loadComponent: () =>
//     import('./user/home/home')
//       .then(m => m.HomeComponent)
// },

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
  component: DashboardComponent,
  children: [
    {
      path: 'orders',
      component: AdminOrdersComponent
    },
    {
      path: 'add-product',
      component: AddProductComponent
    }
  ]
  },

  /* =========================
     FALLBACK
  ========================== */
  {
    path: '**',
    redirectTo: 'home'
  }
];
