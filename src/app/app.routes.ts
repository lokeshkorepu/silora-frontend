import { Routes } from '@angular/router';

import { HomeComponent } from './user/home/home';
import { LoginComponent } from './auth/login/login';
import { CartComponent } from './user/cart/cart';
import { OrdersComponent } from './user/orders/orders';
import { DashboardComponent } from './admin/dashboard/dashboard';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'cart', component: CartComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'admin', component: DashboardComponent },
];
