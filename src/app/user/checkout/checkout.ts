import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';
import { OrderService } from '../../core/services/order.service';
import { PRODUCTS } from '../../core/data/products';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit {

  cartItems: Product[] = [];
  totalAmount = 0;

  // Address form
  name = '';
  phone = '';
  address = '';

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartItems = this.cartService.getCartItems();
    this.totalAmount = this.cartService.getTotalAmount();
  }

  placeOrder() {
    if (!this.name || !this.phone || !this.address) {
      alert('Please fill all address details');
      return;
    }

    // ✅ 1. SAVE ORDER (THIS WAS MISSING)
    this.orderService.saveOrder(
    this.cartItems,
    this.totalAmount
  );

    // ✅ 2. CLEAR CART
    this.cartService.clearCart();

    // ✅ 3. RESET PRODUCT COUNTS (fix Add/+/- issue)
    PRODUCTS.forEach(product => {
      product.count = 0;
    });

    // ✅ 4. GO TO SUCCESS PAGE
    this.router.navigate(['/success']);
  }
}
