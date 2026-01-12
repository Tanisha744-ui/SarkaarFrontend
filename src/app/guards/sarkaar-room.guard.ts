import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SarkaarRoomGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    // Check if user has a valid room code (joined or created a room)
    const roomCode = localStorage.getItem('roomCode');
    if (roomCode && roomCode.trim() !== '') {
      return true;
    }
    // Redirect to a page (e.g., dashboard or room join/create page) if not in a room
    return this.router.createUrlTree(['/sarkaar-room']);
  }
}
