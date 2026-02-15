  import { Component, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { CartService } from '../../core/services/cart.service';
  import { Product } from '../../core/models/product.model';
  import { Router, RouterModule } from '@angular/router';
  import { PRODUCTS } from '../../core/data/products';
  import { OrderService } from '../../core/services/order.service';
  import { Location } from '@angular/common';
  import { AuthService } from '../../core/auth/auth.service';
  
  @Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './cart.html',
    styleUrls: ['./cart.css']
  })
  export class CartComponent implements OnInit {

    cartItems: Product[] = [];
    totalAmount = 0;

    constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private authService: AuthService
  ) {}

    ngOnInit(): void {
      this.refreshCart();
    }

    /* ---------- CART STATE ---------- */
    refreshCart() {
      this.cartItems = this.cartService.getCartItems();
      this.totalAmount = this.cartService.getTotalAmount();
    }

    /* ---------- CART ACTIONS ---------- */
    increase(item: Product) {
      this.cartService.increase(item);
      this.refreshCart();
    }

    decrease(item: Product) {
      this.cartService.decrease(item);
      this.refreshCart();
    }

    clearCart() {
      this.cartService.clearCart();
      this.resetProductCounts();
      this.refreshCart();
    }
    
    goBack() {
     this.cartService.closeCart();
}


    /* ---------- PLACE ORDER (STEP 2.6) ---------- */
  placeOrder() {

  const items = this.cartItems.map(item => ({ ...item }));
  const total = this.totalAmount;

  this.orderService.saveOrder(items, total).subscribe({

    next: () => {

      // ✅ Clear cart only after successful save
      this.cartService.clearCart();

      // ✅ Reset Home product counters
      PRODUCTS.forEach(p => p.count = 0);

      // ✅ Navigate to success page
      this.router.navigate(['/success']);
    },

    error: (err) => {
      console.error('Order failed:', err);
      alert('Order failed ❌ Please try again');
    }

  });
}

    /* ---------- GLOBAL PRODUCT RESET ---------- */
    resetProductCounts() {
      PRODUCTS.forEach(product => {
        product.count = 0;
      });
    }

    onImageError(event: Event) {
    (event.target as HTMLImageElement).src ='/products/no-image.png';

  }
  get totalSavings(): number {
    return this.cartItems.reduce((total, item: any) => {
      if (item.oldPrice) {
        return total + ((item.oldPrice - item.price) * item.count);
      }
      return total;
    }, 0);
  }

  handleProceed() {

  this.cartService.closeCart();
    
  if (this.authService.isLoggedIn()) {
    this.router.navigate(['/checkout']);
  } else {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/checkout' }
    });
  }
}

  }




