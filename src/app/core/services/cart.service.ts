import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  /* =========================
     CART OPEN / CLOSE STATE
  ========================== */
  private cartOpen = new BehaviorSubject<boolean>(false);
  cartOpen$ = this.cartOpen.asObservable();

  openCart() {
    this.cartOpen.next(true);
  }

  closeCart() {
    this.cartOpen.next(false);
  }

  /* =========================
     CART SOURCE OF TRUTH
     (NO LOCAL STORAGE)
  ========================== */

  private cartItemsSubject = new BehaviorSubject<Product[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor() {
    // Start empty (no localStorage)
    this.cartItemsSubject.next([]);
  }

  /* =========================
     GETTERS
  ========================== */

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

  /* =========================
     ACTIONS
  ========================== */

  addToCart(product: Product): void {
    const items = [...this.cartItemsSubject.value];
    const item = items.find(p => p.id === product.id);

    if (item) {
      item.count!++;
    } else {
      items.push({ ...product, count: 1 });
    }

    this.cartItemsSubject.next(items);
  }

  increase(product: Product): void {
    const items = [...this.cartItemsSubject.value];
    const item = items.find(p => p.id === product.id);

    if (item) {
      item.count!++;
      this.cartItemsSubject.next(items);
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

    this.cartItemsSubject.next(items);
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
  }

  resetCart(): void {
    this.clearCart();
  }

  /* =========================
     OPTIONAL FUTURE USE
  ========================== */

  mergeGuestCart(): void {
    // No-op for now (ready for future backend sync)
  }

}
