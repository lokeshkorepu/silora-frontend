import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterLink
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  /* =====================
     LOCATION STATE
  ===================== */
  userLocation: string = 'Detecting location...';
  showPopup = false;
  showLocationPopup = false;
  // showLoginPopup = false;

  /* =====================
     SEARCH
  ===================== */
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

  /* =====================
     CART
  ===================== */
  cartCount = 0;
  private cartSub!: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router,
    public authService: AuthService   // 👈 public for template
  ) {}

  /* =====================
     LIFECYCLE
  ===================== */
  ngOnInit(): void {
    this.startTyping();

    // ✅ single source of truth for cart count
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

  /* =====================
     AUTH HELPERS (CLEAN)
  ===================== */
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get userName(): string {
    return this.authService.getCurrentUser()?.email || '';
  }

  /* =====================
     UI TOGGLES
  ===================== */
  togglePopup() {
    this.showPopup = !this.showPopup;
  }

  // toggleLogin() {
  //   this.showLoginPopup = !this.showLoginPopup;
  // }

  toggleLocationPopup() {
    this.showLocationPopup = !this.showLocationPopup;
  }

  closeDialog() {
    this.showLocationPopup = false;
  }

  /* =====================
     LOCATION
  ===================== */
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

  /* =====================
     SEARCH PLACEHOLDER
  ===================== */
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
/* =====================
   LOGIN / LOGOUT
===================== */
// login(): void {
//   this.authService.login({
//     email: 'admin@silora.com',
//     password: '123456'
//   }).subscribe(() => {

//     this.showLoginPopup = false;

//     // 👇 Redirect admin to admin panel
//     if (this.authService.isAdmin()) {
//       this.router.navigate(['/admin']);
//     }

//   });
// }
// login(): void {
//   this.router.navigate(['/login']);
// }


logout(): void {
  this.authService.logout();
  this.router.navigate(['/']); // optional but recommended
}
openCart() {
  this.cartService.openCart();
}

}
