import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { HostListener } from '@angular/core';
import { AdminNotificationService, AdminNotification } from '../../core/services/admin-notification.service';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule
  ],  
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})

export class AdminLayout implements OnInit {

  notifications$!: Observable<AdminNotification[]>;

constructor(private router: Router, 
            public authService: AuthService,
            public notificationService: NotificationService,
            public adminNotificationService: AdminNotificationService
          ) {}

ngOnInit(): void {
    this.notifications$ =
      this.adminNotificationService.getNotifications();
  }         

logout() {
  // Clear auth/session storage first
  localStorage.clear();
  sessionStorage.clear();

  // Navigate to home page
  this.router.navigateByUrl('/');
}

isDropdownOpen = false;

toggleDropdown() {
  this.isDropdownOpen = !this.isDropdownOpen;
}

async viewOrder(notification: any) {

  await this.adminNotificationService.markAsRead(notification);

  this.isDropdownOpen = false;

  this.router.navigate(['/admin/orders']);
}


@HostListener('document:click', ['$event'])
onClick(event: any) {
  const clickedInside = event.target.closest('.notification-wrapper');
  if (!clickedInside) {
    this.isDropdownOpen = false;
  }
}

getUnreadCount(list: AdminNotification[]): number {
    if (!list) return 0;
    return list.filter(n => !n.readBy?.length).length;
  }

isUnread(notification: any): boolean {

  const user = this.authService.getCurrentUser();

  if (!user || !notification.readBy) {
    return false;
  }

  return !notification.readBy.includes(user.uid);
}

}
