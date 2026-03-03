import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartService } from '../services/cart.service';
import {
  Auth,
  signOut,
  onAuthStateChanged,
  User
} from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc} from '@angular/fire/firestore';

export type UserRole = 'admin' | 'user' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {

  private auth: Auth = inject(Auth);

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  private roleSubject = new BehaviorSubject<UserRole>(null);
  role$ = this.roleSubject.asObservable();

  constructor(
    private cartService: CartService,
    private firestore: Firestore
  ) {
    this.listenToAuthState();
  }

  /* ---------------- AUTH STATE LISTENER ---------------- */

private listenToAuthState(): void {
  onAuthStateChanged(this.auth, async (user) => {
    this.userSubject.next(user);

    if (user) {

      try {
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const role: UserRole = data['role'] === 'admin' ? 'admin' : 'user';
          this.roleSubject.next(role);
        } else {
          this.roleSubject.next('user');
        }

      } catch (error) {
        console.error('Error fetching user role:', error);
        this.roleSubject.next('user');
      }

    } else {
      this.roleSubject.next(null);
    }
  });
}

  /* ---------------- LOGOUT ---------------- */

  logout(): void {
    signOut(this.auth)
      .then(() => {
        this.cartService.clearCart();
      })
      .catch(error => {
        console.error('Logout error:', error);
      });
  }

  /* ---------------- HELPERS ---------------- */

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  isAdmin(): boolean {
    return this.roleSubject.value === 'admin';
  }

  getRole(): UserRole {
    return this.roleSubject.value;
  }

  getUserPhone(): string | null {
    return this.auth.currentUser?.phoneNumber || null;
  }

  getUserObservable() {
  return this.user$;
}

}