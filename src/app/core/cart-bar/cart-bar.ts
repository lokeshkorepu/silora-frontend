import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-bar.html',
  styleUrl: './cart-bar.css',
})
export class CartBar {

  constructor(public cartService: CartService) { }

}
