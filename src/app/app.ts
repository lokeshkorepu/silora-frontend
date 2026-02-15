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

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../environments/environment';
import { getStorage } from 'firebase/storage';

// Initialize Firebase
const app = initializeApp(environment.firebase);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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

      // Lock scroll like Blinkit
      document.body.style.overflow = value ? 'hidden' : 'auto';
    });
  }

  get isAdminRoute(): boolean {
    return this.router.url.includes('/admin');
  }

    // Hide only footer for cart page
  get isCartRoute(): boolean {
    return this.router.url.includes('/cart');
  }

}