import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';

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
export class HeaderComponent implements OnInit {

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

  constructor(private cartService: CartService) { }

  // ===== CART COUNT (SINGLE SOURCE OF TRUTH) =====
  get cartCount(): number {
    return this.cartService.getTotalCount();
  }

  ngOnInit(): void {
    this.startTyping();
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
}
