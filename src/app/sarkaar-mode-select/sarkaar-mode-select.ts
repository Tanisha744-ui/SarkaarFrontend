import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sarkaar-mode-select',
  standalone: true,
  templateUrl: './sarkaar-mode-select.html',
  styleUrl: './sarkaar-mode-select.css',
  imports: []
})
export class SarkaarModeSelect {
  constructor(private router: Router) {}

  playOffline() {
    this.router.navigate(['/team-selection']);
  }

  playOnline() {
    this.router.navigate(['/sarkaar-room']);
  }
}
