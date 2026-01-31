import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.auth.getCurrentUser();
    // Mock rule: logged-in users with email ending admin.com are admins
    if (user && user.email.endsWith('@admin.com')) return true;

    this.router.navigate(['/home']);
    return false;
  }
}
