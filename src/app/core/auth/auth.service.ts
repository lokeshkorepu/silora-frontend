import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { LoginDTO } from './login.dto';
import { CartService } from '../services/cart.service';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';


export type UserRole = 'admin' | 'user' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly USER_KEY = 'logged_user';
  private readonly ROLE_KEY = 'user_role';

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  private roleSubject = new BehaviorSubject<UserRole>(null);
  role$ = this.roleSubject.asObservable();

  constructor(
    private cartService: CartService,
    private auth: Auth,
    private firestore: Firestore   // ✅ Inject Firestore

  ) {
    this.listenToAuthState();
    this.loadUser();
  }

  /* ---------------- LOAD USER ---------------- */

  private loadUser(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser));
    }
  }

  private listenToAuthState(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);

      if (user) {
        const role: UserRole =
          user.email === 'admin@silora.com' ? 'admin' : 'user';

        this.roleSubject.next(role);

        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        localStorage.setItem(this.ROLE_KEY, role);

      } else {
        this.roleSubject.next(null);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.ROLE_KEY);
      }
    });
  }

  /* ---------------- AUTH ACTIONS ---------------- */

  login(dto: LoginDTO): Observable<User> {
    return from(
      signInWithEmailAndPassword(this.auth, dto.email, dto.password)
    ).pipe(
      tap(() => {
        this.cartService.mergeGuestCart?.();
      }),
      map(result => result.user)
    );
  }

  signup(email: string, password: string, name: string): Observable<User> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      tap(async (result) => {
        const uid = result.user?.uid;
        if (uid) {
          const userRef = doc(this.firestore, `users/${uid}`);
          await setDoc(userRef, {
            uid,
            name,
            email,
            createdAt: new Date()
          });
        }
      }),
      map(result => result.user)
    );
  }

  logout(): void {
    signOut(this.auth).then(() => {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.ROLE_KEY);

      this.userSubject.next(null);
      this.roleSubject.next(null);

      this.cartService.clearCart();
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
    return (
      this.isLoggedIn() &&
      localStorage.getItem(this.ROLE_KEY) === 'admin'
    );
  }

  getRole(): UserRole | null {
    return localStorage.getItem(this.ROLE_KEY) as UserRole | null;
  }
}
