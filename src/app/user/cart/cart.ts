import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';
import { Router, RouterModule } from '@angular/router';
import { PRODUCTS } from '../../core/data/products';

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
    private router: Router
  ) { }

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

  /* ---------- PLACE ORDER (STEP 2.6) ---------- */
  placeOrder() {

    // 1️⃣ Clear cart service
    this.cartService.clearCart();

    // 2️⃣ Reset ALL home product counts
    this.resetProductCounts();

    // 3️⃣ Navigate back to Home (fresh state)
    this.router.navigate(['/home']);
  }

  /* ---------- GLOBAL PRODUCT RESET ---------- */
  resetProductCounts() {
    PRODUCTS.forEach(product => {
      product.count = 0;
    });
  }
}
