import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-imposter-mode',
  standalone: true,
  templateUrl: './imposter-mode.html',
  styleUrls: ['./imposter-mode.css']
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