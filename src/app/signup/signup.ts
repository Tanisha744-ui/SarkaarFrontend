import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
    loading: boolean = false;
  username: string = '';
  email: string = '';
  password: string = '';
  roleId = 2;
  errorMsg: string = '';
  successMsg: string = '';

  constructor(private router: Router, private http: HttpClient) { }

  onSignup(signupForm: any) {
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = true;
    const payload = {
      username: this.username,
      email: this.email,
      password: this.password,
      roleId: this.roleId
    };
    this.http.post('https://gamebackend-i03z.onrender.com/signup', payload).subscribe({
      next: (res: any) => {
        this.successMsg = 'Signup successful! Redirecting to login...';
        this.loading = false;
        signupForm.resetForm();
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 409) {
          this.errorMsg = 'Email already exists. Please try a different one.';
        } else if (typeof err.error === 'string' && err.error.trim() !== '') {
          this.errorMsg = err.error;
        } else if (err.error?.message) {
          this.errorMsg = err.error.message;
        } else {
          this.errorMsg = 'Signup failed. Please try again.';
        }
      }
    });
  }
}
