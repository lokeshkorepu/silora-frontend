import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../auth/auth.service';
import { ElementRef, ViewChild, HostListener } from '@angular/core';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { collection, collectionData, query, orderBy, startAt, endAt } from '@angular/fire/firestore';
import { ReactiveFormsModule } from '@angular/forms';
import { Output, EventEmitter } from '@angular/core';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterLink,
    ReactiveFormsModule
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})

export class HeaderComponent implements OnInit, OnDestroy {

  userLocation: string = 'Detecting location...';
  showPopup = false;
  showLocationPopup = false;
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
  userPhone: string | null = '';
  @ViewChild('accountWrapper') accountWrapper!: ElementRef;
  @Output() searchChanged = new EventEmitter<string>();
  showAccountDropdown = false; 
  cartCount = 0;
  private cartSub!: Subscription;
  searchControl = new FormControl<string>('');
  products$: Observable<any[]> | undefined;

  constructor(
    private cartService: CartService,
    private router: Router,
    private productService: ProductService,
    public authService: AuthService   // 👈 public for template
  ) { }

  ngOnInit(): void {

    // this.startTyping();

      this.userPhone = this.authService.getUserPhone();

      this.cartSub = this.cartService.cartItems$.subscribe(items => {
      this.cartCount = items.reduce(
        (sum, item) => sum + (item.count || 0),
        0 ); });

        this.searchControl.valueChanges
    .pipe(debounceTime(400))
    .subscribe(value => {
      console.log("Header sending:", value);
      this.productService.searchProducts(value ?? '');
      // this.searchChanged.emit(value || '');
    });
    
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get userName(): string {
    return this.authService.getCurrentUser()?.email || '';
  }

  togglePopup() {
    this.showPopup = !this.showPopup;
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
      });
  }

  searchLocation() {
    alert(`Searching for: ${this.searchQuery}`);
    this.showLocationPopup = false;
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

logout() {
  this.authService.logout();
  this.showAccountDropdown = false;
}

openCart() {
  this.cartService.openCart();
}

toggleAccountDropdown() {
  this.showAccountDropdown = !this.showAccountDropdown;
}

@HostListener('document:click', ['$event'])
onClickOutside(event: MouseEvent) {
  if (
    this.showAccountDropdown &&
    this.accountWrapper &&
    !this.accountWrapper.nativeElement.contains(event.target)
  ) {
    this.showAccountDropdown = false;
  }
}



}
