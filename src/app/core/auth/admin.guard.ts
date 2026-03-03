import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate() {
    return this.auth.role$.pipe(
      take(1),
      map(role => {

        if (role === 'admin') {
          return true;
        }

        this.router.navigate(['/']);
        return false;
      })
    );
  }
}