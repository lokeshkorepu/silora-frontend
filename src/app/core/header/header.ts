import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {

  userLocation: string = 'Detecting location...';
  showPopup = false;
  showLocationPopup = false;
  showLoginPopup = false;

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

  constructor() {
    this.startTyping();
  }

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

  searchLocation() {
    alert(`Searching for: ${this.searchQuery}`);
    this.showLocationPopup = false;
  }
}
