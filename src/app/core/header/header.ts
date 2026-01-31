import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../auth/auth.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule   // ✅ required for routerLink
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  // ===== LOCATION STATE =====
  userLocation: string = 'Detecting location...';
  showPopup = false;
  showLocationPopup = false;
  showLoginPopup = false;

  // ===== SEARCH =====
  searchQuery: string = '';
  error: string = '';

  placeholders = [
    'Search "bread"',
    'Search "milk"',
    'Search "eggs"',
    'Search "fruits"',
    'Search "rice"',
    'Search "vegetables"',
    'Search "snacks"',
    'Search "chocolates"',
    'Search "drinks"'
  ];

  typedText = '';
  placeholderIndex = 0;
  charIndex = 0;
  isDeleting = false;

  // ===== CART COUNT (FIXED) =====
  cartCount: number = 0;
  private cartSub!: Subscription;

constructor(
  private cartService: CartService,
  private authService: AuthService
) {}

get isLoggedIn(): boolean {
  return this.authService.isLoggedIn();
}

get userName(): string {
  return this.authService.getCurrentUser()?.name || '';
}


  ngOnInit(): void {
    this.startTyping();

    // ✅ SINGLE SOURCE OF TRUTH
    this.cartSub = this.cartService.cartItems$.subscribe(items => {
      this.cartCount = items.reduce(
        (sum, item) => sum + (item.count || 0),
        0
      );
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  // ===== UI TOGGLES =====
  togglePopup() {
    this.showPopup = !this.showPopup;
  }

  toggleLogin() {
    this.showLoginPopup = !this.showLoginPopup;
  }

  toggleLocationPopup() {
    this.showLocationPopup = !this.showLocationPopup;
  }

  closeDialog() {
    this.showLocationPopup = false;
  }

  // ===== LOCATION =====
  fetchLocation() {
    if (!navigator.geolocation) {
      this.error = 'Geolocation not supported';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        this.userLocation = 'Location detected';
        this.error = '';
      },
      () => {
        this.userLocation = 'Location unavailable';
        this.error = 'Permission denied';
      }
    );
  }

  searchLocation() {
    alert(`Searching for: ${this.searchQuery}`);
    this.showLocationPopup = false;
  }

  // ===== SEARCH PLACEHOLDER ANIMATION =====
  startTyping() {
    const currentText = this.placeholders[this.placeholderIndex];

    if (!this.isDeleting) {
      this.typedText = currentText.substring(0, this.charIndex + 1);
      this.charIndex++;

      if (this.charIndex === currentText.length) {
        setTimeout(() => this.isDeleting = true, 1000);
      }
    } else {
      this.typedText = currentText.substring(0, this.charIndex - 1);
      this.charIndex--;

      if (this.charIndex === 0) {
        this.isDeleting = false;
        this.placeholderIndex =
          (this.placeholderIndex + 1) % this.placeholders.length;
      }
    }

    setTimeout(() => this.startTyping(), this.isDeleting ? 60 : 90);
  }

  login(): void {
    console.log('LOGIN CLICKED');
  this.authService.login({
    email: 'test@admin.com',
    password: '123456'
  }).subscribe(() => {
    this.showLoginPopup = false;
  });
}

get isAdmin(): boolean {
  const user = this.authService.getCurrentUser();
  return !!user && user.email.endsWith('@admin.com');
}


}
