import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, delay } from 'rxjs';
import { User } from './user.model';
import { LoginDTO } from './login.dto';
import { CartService } from '../services/cart.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private USER_KEY = 'logged_user';

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private cartService: CartService) {
    this.loadUser();
  }

  /* ---------------- LOAD USER ---------------- */

  private loadUser(): void {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      this.userSubject.next(JSON.parse(stored));
    }
  }

  /* ---------------- AUTH ACTIONS ---------------- */

  login(dto: LoginDTO): Observable<User> {
    // 🔹 MOCK LOGIN (replace with API later)
    const user: User = {
      id: 'USER-' + Date.now(),
      name: 'Lokesh',
      email: dto.email
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);

    // ✅ merge guest cart after login
    this.cartService.mergeGuestCart?.();

    return of(user).pipe(delay(600));
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
    this.cartService.clearCart();
  }

  /* ---------------- HELPERS ---------------- */

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }
}
