import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private STORAGE_KEY = 'cart';

  /* ---------------- SOURCE OF TRUTH ---------------- */

  private cartItemsSubject = new BehaviorSubject<Product[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  /* ---------------- LOAD & SAVE ---------------- */

 private loadCart(): void {
  const savedVersion = localStorage.getItem('app_version');

  // ✅ If app version changed → reset cart
  if (savedVersion !== '1.0.0') {
    localStorage.clear();
    localStorage.setItem('app_version', '1.0.0');
    this.cartItemsSubject.next([]);
    return;
  }

  const storedCart = localStorage.getItem(this.STORAGE_KEY);

  if (storedCart) {
    try {
      const items = JSON.parse(storedCart);
      if (Array.isArray(items)) {
        this.cartItemsSubject.next(items);
        return;
      }
    } catch {}
  }

  this.cartItemsSubject.next([]);
}


  private saveCart(items: Product[]): void {
    this.cartItemsSubject.next(items);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  /* ---------------- GETTERS (UNCHANGED API) ---------------- */

  getCartItems(): Product[] {
    return this.cartItemsSubject.value;
  }

  getTotalCount(): number {
    return this.cartItemsSubject.value.reduce(
      (sum, item) => sum + (item.count || 0),
      0
    );
  }

  getTotalAmount(): number {
    return this.cartItemsSubject.value.reduce(
      (sum, item) => sum + (item.price * (item.count || 0)),
      0
    );
  }

  getProductCount(productId: string): number {
    const item = this.cartItemsSubject.value.find(p => p.id === productId);
    return item ? item.count || 0 : 0;
  }

  /* ---------------- ACTIONS (SAME BEHAVIOR) ---------------- */

  addToCart(product: Product): void {
    const items = [...this.cartItemsSubject.value];
    const item = items.find(p => p.id === product.id);

    if (item) {
      item.count!++;
    } else {
      items.push({ ...product, count: 1 });
    }

    this.saveCart(items);
  }

  increase(product: Product): void {
    const items = [...this.cartItemsSubject.value];
    const item = items.find(p => p.id === product.id);

    if (item) {
      item.count!++;
      this.saveCart(items);
    }
  }

  decrease(product: Product): void {
    let items = [...this.cartItemsSubject.value];
    const item = items.find(p => p.id === product.id);

    if (!item) return;

    if (item.count! > 1) {
      item.count!--;
    } else {
      items = items.filter(p => p.id !== product.id);
    }

    this.saveCart(items);
  }

  clearCart(): void {
    this.saveCart([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  resetCart(): void {
    this.clearCart();
  }

  /* ---------------- LEGACY ORDER HELPERS (UNCHANGED) ---------------- */

  getOrders(): any[] {
    return JSON.parse(localStorage.getItem('orders') || '[]');
  }

  saveOrder(): void {
    const existingOrders = JSON.parse(
      localStorage.getItem('orders') || '[]'
    );

    const newOrder = {
      id: Date.now(),
      items: this.cartItemsSubject.value,
      total: this.getTotalAmount(),
      date: new Date().toISOString()
    };

    existingOrders.unshift(newOrder);
    localStorage.setItem('orders', JSON.stringify(existingOrders));
  }

  /* ---------------- AUTH MERGE (OPTION B) ---------------- */

/**
 * Called after user login.
 * Currently cart is already local, so nothing to do.
 * Later this will sync guest cart with backend user cart.
 */
mergeGuestCart(): void {
  // NO-OP for now (intentionally empty)
}

}
