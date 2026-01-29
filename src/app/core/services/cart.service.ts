import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItems: Product[] = [];

  constructor() {
    this.loadCart();
  }

  /* ---------------- LOAD & SAVE ---------------- */

  private loadCart() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      this.cartItems = JSON.parse(storedCart);
    }
  }

  private saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
  }

  /* ---------------- GETTERS ---------------- */

  getCartItems(): Product[] {
    return this.cartItems;
  }

  getTotalCount(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.count || 0), 0);
  }

  getTotalAmount(): number {
    return this.cartItems.reduce(
      (sum, item) => sum + (item.price * (item.count || 0)),
      0
    );
  }

  /* ---------------- ACTIONS ---------------- */

  addToCart(product: Product) {
    const item = this.cartItems.find(p => p.id === product.id);

    if (item) {
      item.count!++;
    } else {
      this.cartItems.push({ ...product, count: 1 });
    }

    this.saveCart();
  }

  increase(product: Product) {
    const item = this.cartItems.find(p => p.id === product.id);
    if (item) {
      item.count!++;
      this.saveCart();
    }
  }

  decrease(product: Product) {
    const item = this.cartItems.find(p => p.id === product.id);
    if (!item) return;

    if (item.count! > 1) {
      item.count!--;
    } else {
      this.cartItems = this.cartItems.filter(p => p.id !== product.id);
    }

    this.saveCart();
  }

  clearCart() {
    //this.cartItems.forEach(item => item.count = 0);
    this.cartItems = [];
    localStorage.removeItem('cart');
  }

  getProductCount(productId: number): number {
    const item = this.cartItems.find(p => p.id === productId);
    return item ? item.count || 0 : 0;
  }

  resetCart() {
    this.cartItems = [];
    localStorage.removeItem('cart');
  }
  getOrders(): any[] {
    return JSON.parse(localStorage.getItem('orders') || '[]');
  }

  saveOrder() {
    const orders = this.getOrders();
    orders.push({
      date: new Date(),
      items: this.cartItems,
      total: this.getTotalAmount()
    });
    localStorage.setItem('orders', JSON.stringify(orders));
  }

}
