import { Component } from '@angular/core';
import { HeaderComponent } from './core/header/header';
import { AuthComponent } from './auth/auth';  // ✅ Import your AuthComponent
import { Footer } from './core/footer/footer';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CartComponent } from './user/cart/cart';
import { CartService } from './core/services/cart.service';
import { FormsModule } from '@angular/forms';



@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  imports: [RouterOutlet, CommonModule, HeaderComponent, Footer, CartComponent],  
})
export class AppComponent {

  isCartOpen = false;

  constructor(public router: Router,
              private cartService: CartService
  ) {
     this.cartService.cartOpen$.subscribe(value => {
      this.isCartOpen = value;
      document.body.style.overflow = value ? 'hidden' : 'auto';
    });
  }

  get isAdminRoute(): boolean {
    return this.router.url.includes('/admin');
  }

  get isCartRoute(): boolean {
    return this.router.url.includes('/cart');
  }

}