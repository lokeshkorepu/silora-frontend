import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { HostListener } from '@angular/core';
import { AdminNotificationService, AdminNotification } from '../../core/services/admin-notification.service';
import { Observable } from 'rxjs';
import { Firestore } from '@angular/fire/firestore';
import { collection, getDocs, doc, updateDoc, deleteField } from '@angular/fire/firestore';

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
  private previousNotificationCount = 0;
  toastMessage: string | null = null;


constructor(private router: Router, 
            public authService: AuthService,
            public notificationService: NotificationService,
            public adminNotificationService: AdminNotificationService,
            private firestore: Firestore
          ) {}

ngOnInit(): void {

  this.notifications$ =
    this.adminNotificationService.getNotifications();

  // 🔔 Toast trigger from Firestore
  this.notifications$.subscribe(list => {

    const user = this.authService.getCurrentUser();
    if (!user) return;

    const unread = list.filter(n =>
      !n.readBy?.includes(user.uid)
    );

    if (this.previousNotificationCount &&
        unread.length > this.previousNotificationCount) {

      this.toastMessage = '🎉 New order received!';

      setTimeout(() => {
        this.toastMessage = null;
      }, 4000);
    }

    this.previousNotificationCount = unread.length;
  });
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

  const user = this.authService.getCurrentUser();
  if (!user || !list) return 0;

  return list.filter(n =>
    !n.readBy?.includes(user.uid)
  ).length;
}


isUnread(notification: any): boolean {

  const user = this.authService.getCurrentUser();

  if (!user || !notification.readBy) {
    return false;
  }

  return !notification.readBy.includes(user.uid);
}

getUnreadNotifications(list: AdminNotification[] | null): AdminNotification[] {

  const user = this.authService.getCurrentUser();
  if (!user || !list) return [];

  return list.filter(n =>
    !n.readBy?.includes(user.uid)
  );
}

async viewAllNotifications(list: AdminNotification[]) {

  const user = this.authService.getCurrentUser();
  if (!user || !list) return;

  // 🔥 Get only unread notifications
  const unreadNotifications = list.filter(n =>
    !n.readBy?.includes(user.uid)
  );

  // 🔥 Mark each unread notification as read in Firestore
  for (const notification of unreadNotifications) {
    await this.adminNotificationService.markAsRead(notification);
  }

  // Close dropdown
  this.isDropdownOpen = false;

  // Navigate
  this.router.navigate(['/admin/orders']);
}


async migrateCategoryField() {

  const productsSnap = await getDocs(collection(this.firestore, 'products'));
  const categoriesSnap = await getDocs(collection(this.firestore, 'categories'));

  const categories: any[] = [];

  categoriesSnap.forEach(catDoc => {
    categories.push({
      id: catDoc.id,
      name: (catDoc.data() as any).name.toLowerCase().trim()
    });
  });

  for (const productDoc of productsSnap.docs) {

    const data: any = productDoc.data();

    // Only update products that don't have categoryId
    if (!data.categoryId && data.category) {

      const oldCategory = data.category.toLowerCase().trim();

      // 🔥 Smart match (contains instead of exact match)
      const match = categories.find(c =>
        oldCategory.includes(c.name)
      );

      if (match) {

        await updateDoc(
          doc(this.firestore, 'products', productDoc.id),
          {
            categoryId: match.id,
            category: deleteField()
          }
        );

        console.log(`✅ Updated: ${data.name}`);
      } else {
        console.warn(`❌ No match found for: ${data.name} (${data.category})`);
      }
    }
  }

  console.log('🎉 Migration completed successfully');
}

}
