import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { LoginDTO } from '../../core/auth/login.dto';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
  this.returnUrl =
    this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
}

  onLogin(): void {
    this.loading = true;
    this.errorMessage = '';

    const dto: LoginDTO = {
      email: this.email,
      password: this.password
    };

    this.authService.login(dto).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.message || 'Login failed';
}
    });
  }
}
