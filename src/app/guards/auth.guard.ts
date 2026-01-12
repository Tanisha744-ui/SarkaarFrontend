
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
	constructor(private router: Router) {}

	canActivate(): boolean | UrlTree {
		// Replace this logic with your actual authentication check
		const isLoggedIn = !!localStorage.getItem('userToken');
		if (isLoggedIn) {
			return true;
		}
		// Redirect to login if not authenticated
		return this.router.createUrlTree(['/login']);
	}
}
