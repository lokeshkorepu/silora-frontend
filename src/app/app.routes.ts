import { Routes } from '@angular/router';

import { HomeComponent } from './user/home/home';
import { LoginComponent } from './auth/login/login';
import { CartComponent } from './user/cart/cart';
import { CheckoutComponent } from './user/checkout/checkout';
import { OrderSuccess } from './user/order-success/order-success';
import { DashboardComponent } from './admin/dashboard/dashboard';
import { AdminOrdersComponent } from './admin/orders/admin-orders';
import { AddProductComponent } from './admin/add-product/add-product';
import { AddCategory } from './admin/add-category/add-category';


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
     AUTH ROUTES
  ========================== */
  {
    path: 'login',
    component: LoginComponent
  },


  /* =========================
     USER ROUTES
  ========================== */
  //  {
  //   path: 'home',
  //   loadComponent: () =>
  //     import('./user/home/home')
  //       .then(m => m.HomeComponent)
  // },
  // {
  //   path: 'cart',
  //   component: CartComponent
  // },
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
   ADMIN ROUTES
========================== */
{
  path: 'admin',
  canActivate: [AdminGuard],   // protect admin
  loadComponent: () =>
    import('./admin/admin-layout/admin-layout')
      .then(m => m.AdminLayout),
  children: [
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full'
    },
    {
      path: 'dashboard',
      component: DashboardComponent
    },
    {
      path: 'orders',
      component: AdminOrdersComponent
    },
    {
      path: 'add-product/:id',
      component: AddProductComponent
   },
    {
      path: 'add-product',
      component: AddProductComponent
    },
    {
  path: 'add-category',
  component: AddCategory
},
{
  path: 'edit-category/:id',
  component: AddCategory
},

    {
  path: 'products',
  loadComponent: () =>
    import('./admin/products/products')
      .then(m => m.Products)
}]
},

  /* =========================
     FALLBACK
  ========================== */
  {
  path: '**',
  redirectTo: ''
}
];
