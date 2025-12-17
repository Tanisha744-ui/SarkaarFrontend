import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink,CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
    loading: boolean = false;
  email: string = '';
  password: string = '';
  errorMsg: string = '';
  successMsg: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  onLogin() {
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = true;
    const payload = {
      email: this.email,
      password: this.password
    };
    this.http.post('http://localhost:5046/login', payload).subscribe({
      next: (res: any) => {
        if (res && res.username && res.roleid) {
          localStorage.setItem('username', res.username);
          localStorage.setItem('roleid', res.roleid.toString());
          localStorage.setItem('email', res.email || this.email);
        } else {
          localStorage.setItem('email', this.email);
        }
        this.successMsg = 'Login successful! Redirecting...';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/index']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (typeof err.error === 'string' && err.error.trim() !== '') {
          this.errorMsg = err.error;
        } else if (err.error?.message) {
          this.errorMsg = err.error.message;
        } else {
          this.errorMsg = 'Login failed. Please try again.';
        }
      }
    });
  }
}
