import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';

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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cartItems = this.cartService.getCartItems();
    this.totalAmount = this.cartService.getTotalAmount();
  }

  placeOrder() {
    if (!this.name || !this.phone || !this.address) {
      alert('Please fill all address details');
      return;
    }

    alert('🎉 Order placed successfully!');

    // Clear cart after order
    this.cartService.clearCart();

    // Redirect to home
    this.router.navigate(['/home']);
  }
}
