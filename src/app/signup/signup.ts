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
    const payload = {
      username: this.username,
      email: this.email,
      password: this.password,
      roleId: this.roleId
    };
    this.http.post('http://localhost:5046/signup', payload).subscribe({
      next: (res: any) => {
        console.log('Signup response:', res);
        this.successMsg = 'Signup successful! Redirecting to login...';

        signupForm.resetForm();

        setTimeout(() => this.router.navigate(['/login']), 1000);
      },

      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.errorMsg = 'Email already exists. Please try a different one.';
        } else {
          this.errorMsg = err.error?.message || 'Signup failed. Please try again.';
        }
      }

    });
  }
}
