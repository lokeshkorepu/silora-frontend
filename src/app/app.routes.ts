import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login';
import { CheckoutComponent } from './user/checkout/checkout';
import { OrderSuccess } from './user/order-success/order-success';
import { DashboardComponent } from './admin/dashboard/dashboard';
import { AdminOrdersComponent } from './admin/orders/admin-orders';
import { AddProductComponent } from './admin/add-product/add-product';
import { AddCategory } from './admin/add-category/add-category';
import { LandingComponent } from './user/landing/landing';
import { CategoryPageComponent } from './user/category-page/category-page';

import { AuthGuard } from './core/auth/auth.guard';
import { AdminGuard } from './core/auth/admin.guard';

export const routes: Routes = [

  /* =========================
     PUBLIC ROUTES
  ========================== */
   {
    path: '',
    loadComponent: () =>
      import('./user/landing/landing')
        .then(m => m.LandingComponent)
  },
    {
  path: 'category/:categoryId/:subcategoryId',
  loadComponent: () =>
    import('./user/category-page/category-page')
      .then(m => m.CategoryPageComponent)
},
{
  path: 'category/:categoryId',
  loadComponent: () =>
    import('./user/category-page/category-page')
      .then(m => m.CategoryPageComponent)
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
