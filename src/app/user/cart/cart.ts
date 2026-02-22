import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
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
    this.refreshCart();
  }

  goBack() {
    this.cartService.closeCart();
  }

  /* ---------- PLACE ORDER ---------- */
  placeOrder() {

    const items = this.cartItems.map(item => ({ ...item }));
    const total = this.totalAmount;

    this.orderService.saveOrder(items, total).subscribe({

      next: () => {
        this.cartService.clearCart();
        this.router.navigate(['/success']);
      },

      error: (err) => {
        console.error('Order failed:', err);
        alert('Order failed ❌ Please try again');
      }

    });
  }

  /* ---------- IMAGE FALLBACK ---------- */
  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/products/no-image.png';
  }

  /* ---------- TOTAL SAVINGS ---------- */
  get totalSavings(): number {
    return this.cartItems.reduce((total, item: any) => {
      if (item.originalPrice) {
        return total + ((item.originalPrice - item.price) * (item.count || 0));
      }
      return total;
    }, 0);
  }

  /* ---------- CHECKOUT FLOW ---------- */
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