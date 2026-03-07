import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';
import { OrderService } from '../../core/services/order.service';

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

  const orderItems = this.cartItems.map(item => ({
    productId: item.id || '',
    name: item.name,
    price: item.price,

    quantityValue: item.quantityValue ?? 0,
    quantityUnit: item.quantityUnit ?? '',

    orderQuantity: item.count ?? 1,

    imageUrl: item.imageUrl ?? ''
  }));

  this.orderService.saveOrder(
    orderItems,
    this.totalAmount
  ).subscribe({

    next: () => {
      this.cartService.clearCart();
      this.router.navigate(['/success']);
    },

    error: () => {
      alert('Order failed ❌ Please try again');
    }

  });
}
}