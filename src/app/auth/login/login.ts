import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';
import { LoginDTO } from '../../core/auth/login.dto';

// import { Auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from '@angular/fire/auth';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatSnackBarModule],
templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class LoginComponent implements OnInit {

  // email = '';
  // password = '';
  // errorMessage = '';

  phoneNumber = '';
  otp = '';
  countdown = 25;
  private timer: any;
  
  loading = false;
  showOtpField = false;
  showSuccessPopup = false;

  confirmationResult!: ConfirmationResult;
  // recaptchaVerifier!: RecaptchaVerifier;

  returnUrl: string = '/home';

  private auth = getAuth();
  private recaptchaVerifier!: RecaptchaVerifier;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    // private auth: Auth
  ) {}

  ngOnInit(): void {
  this.returnUrl =
    this.route.snapshot.queryParamMap.get('returnUrl') || '/';
}

sendOTP(): void {

  if (!this.phoneNumber || this.phoneNumber.length !== 10) {
    this.snackBar.open('Enter valid 10 digit number', 'Close', { duration: 3000 });
    return;
  }

  const fullPhone = `+91${this.phoneNumber}`;
  this.loading = true;

  this.recaptchaVerifier = new RecaptchaVerifier(
  this.auth,                 // ✅ Auth FIRST
  'recaptcha-container',     // ✅ Container SECOND
  {
    size: 'invisible'
  }
);

  signInWithPhoneNumber(this.auth, fullPhone, this.recaptchaVerifier)
    .then(result => {
      this.loading = false;
      this.confirmationResult = result;
      this.showOtpField = true;
      this.startTimer();
    })
    .catch(error => {
      this.loading = false;
      console.error(error);
      this.snackBar.open(error.message, 'Close', { duration: 3000 });
    });
}

  verifyOTP(): void {

  if (!this.otp) {
    this.snackBar.open('Enter OTP', 'Close', { duration: 3000 });
    return;
  }

  this.loading = true;

  this.confirmationResult.confirm(this.otp)
    .then(() => {

      this.loading = false;
      this.showOtpField = false;
      this.showSuccessPopup = true;

      // Wait for AuthService to fetch role from Firestore
      const sub = this.authService.role$.subscribe(role => {

        console.log("Role from backend:", role);

        if (!role) return; // wait until role is loaded

        setTimeout(() => {

          if (role === 'admin') {
            this.router.navigate(['/admin']);
          } else {

            const returnUrl =
              this.route.snapshot.queryParamMap.get('returnUrl');

            if (returnUrl && returnUrl !== '/login') {
              this.router.navigateByUrl(returnUrl);
            } else {
              this.router.navigate(['/']);
            }
          }

          sub.unsubscribe(); // prevent multiple triggers

        }, 800);

      });

    })
    .catch(error => {

      this.loading = false;
      console.error(error);
      this.snackBar.open('Invalid OTP', 'Close', { duration: 3000 });

    });
}
  moveNext(event: any, nextInput: HTMLInputElement) {
  if (event.target.value.length === 1) {
    nextInput.focus();
  }
}

collectOTP(o1: HTMLInputElement, o2: HTMLInputElement, o3: HTMLInputElement, o4: HTMLInputElement, o5: HTMLInputElement, o6: HTMLInputElement) {
  this.otp = o1.value + o2.value + o3.value + o4.value + o5.value + o6.value ;
}

startTimer() {
  this.countdown = 25;
  this.timer = setInterval(() => {
    this.countdown--;
    if (this.countdown <= 0) {
      clearInterval(this.timer);
    }
  }, 1000);
}

goBack(): void {

  // If OTP screen is open → go back to phone screen
  if (this.showOtpField) {
    this.showOtpField = false;
    return;
  }

  // Otherwise navigate back
  if (this.returnUrl && this.returnUrl !== '/login') {
    this.router.navigateByUrl(this.returnUrl);
  } else {
    this.router.navigate(['/']);
  }
}

get ctaText(): string {
    return this.returnUrl === '/checkout'
      ? 'Continue to Checkout'
      : 'Login';
  }

//  onLogin(): void {
//   if (this.loading) return;

//   this.loading = true;

//   const dto: LoginDTO = {
//     email: this.email,
//     password: this.password
//   };

//   this.authService.login(dto).subscribe({
//     next: () => {
//       this.loading = false;

//       // 🔥 Use returnUrl first
//       const returnUrl =
//         this.route.snapshot.queryParamMap.get('returnUrl');

//       if (returnUrl && returnUrl !== '/login') {
//         this.router.navigateByUrl(returnUrl);
//         return;
//       }

//       // If no valid returnUrl, then role-based redirect
//       if (this.authService.isAdmin()) {
//         this.router.navigate(['/admin']);
//       } else {
//         this.router.navigate(['/']);
//       }
//     },
//     error: () => {
//       this.loading = false;
//       this.snackBar.open('Invalid email or password', 'Close', {
//         duration: 3000,
//         panelClass: ['error-snackbar']
//       });
//     }
//   });
// }


//   onLogin(): void {
//     if(this.loading) return;

//     this.loading = true;
//     // this.errorMessage = '';

//     setTimeout(() => {
//       const success = this.email && this.password;

//       this.loading = false;

//       if(!success) {
//         this.snackBar.open('Invalid email or password', 'Close', {
//           duration: 3000,
//           panelClass: ['error-snackbar']
//         });
//         return;
//       }
//       this.router.navigateByUrl(this.returnUrl);
//     }, 1200);
//   }
// }
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
}
