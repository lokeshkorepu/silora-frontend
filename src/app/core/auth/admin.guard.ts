import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
  const user = this.auth.getCurrentUser();

  if (user?.email && user.email === 'admin@silora.com') {
    return true;
  }

  this.router.navigate(['/home']);
  return false;
}

}
