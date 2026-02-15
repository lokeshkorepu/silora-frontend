import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../services/cart.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-bar.html',
  styleUrl: './cart-bar.css',
})
export class CartBar {

  isCartOpen = false;

  constructor(public cartService: CartService) { 
    this.cartService.cartOpen$.subscribe(value => {
      this.isCartOpen = value;
    });
  }

  openCart() {
  this.cartService.openCart();
}
}
