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
  email: string = '';
  password: string = '';
  errorMsg: string = '';
  successMsg: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  onLogin() {
    this.errorMsg = '';
    this.successMsg = '';
    const payload = {
      email: this.email,
      password: this.password
    };
    this.http.post('http://localhost:5046/login', payload).subscribe({
      next: (res: any) => {
        // Expecting backend to return { username, email, roleid }
        if (res && res.username && res.roleid) {
          localStorage.setItem('username', res.username);
          localStorage.setItem('roleid', res.roleid.toString());
          localStorage.setItem('email', res.email || this.email);
        } else {
          // fallback if backend does not return username/roleid
          localStorage.setItem('email', this.email);
        }
        this.successMsg = 'Login successful! Redirecting...';
        setTimeout(() => this.router.navigate(['/index']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
