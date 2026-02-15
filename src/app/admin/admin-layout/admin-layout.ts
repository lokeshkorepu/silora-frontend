import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule
  ],  
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})

export class AdminLayout {

constructor(private router: Router, private authService: AuthService) {}

logout() {
  // Clear auth/session storage first
  localStorage.clear();
  sessionStorage.clear();

  // Navigate to home page
  this.router.navigateByUrl('/');
}




}
