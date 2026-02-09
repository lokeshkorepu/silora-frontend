import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';
import { LoginDTO } from '../../core/auth/login.dto';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, 
            FormsModule,
            MatSnackBarModule],
templateUrl: './login.html',
  styleUrls: ['../auth.css']
})

export class LoginComponent {

  email = '';
  password = '';
  errorMessage = '';
  loading = false;
  returnUrl: string = '/home';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
  this.returnUrl =
    this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
}

get ctaText(): string {
    return this.returnUrl === '/checkout'
      ? 'Continue to Checkout'
      : 'Login';
  }

  onLogin(): void {
    if(this.loading) return;

    this.loading = true;
    // this.errorMessage = '';

    setTimeout(() => {
      const success = this.email && this.password;

      this.loading = false;

      if(!success) {
        this.snackBar.open('Invalid email or password', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }
      this.router.navigateByUrl(this.returnUrl);
    }, 1200);
  }
}
//     })

//     const dto: LoginDTO = {
//       email: this.email,
//       password: this.password
//     };

//     this.authService.login(dto).subscribe({
//       next: () => {
//         this.loading = false;
//         this.router.navigateByUrl(this.returnUrl);
//       },
//       error: (err: any) => {
//         this.loading = false;
//         this.errorMessage = err?.message || 'Login failed';
// }
//     });
//   }
// }
