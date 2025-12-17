import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-imposter-mode',
  standalone: true,
  template: `
    <div class="mode-container">
      <h2>Choose Imposter Game Mode</h2>
      <button (click)="goOnline()" class="mode-btn">Online</button>
      <button (click)="goOffline()" class="mode-btn">Offline</button>
    </div>
  `,
  styles: [`
    .mode-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 80px;
    }
    .mode-btn {
      margin: 16px;
      padding: 16px 32px;
      font-size: 1.2rem;
      border-radius: 12px;
      border: none;
      background: linear-gradient(90deg, #00c6fb 0%, #7f53ac 100%);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
      transition: background 0.2s;
    }
    .mode-btn:hover {
      background: linear-gradient(90deg, #7f53ac 0%, #00c6fb 100%);
    }
  `]
})
export class ImposterMode {
  constructor(private router: Router) {}

  goOnline() {
    this.router.navigate(['/imposter-game']);
  }

  goOffline() {
    this.router.navigate(['/imposter-offline']);
  }
}