import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tambola-online',
  templateUrl: './tambola-online.component.html',
  styleUrls: ['./tambola-online.component.css'],
  imports: [FormsModule]
})
export class TambolaOnlineComponent {
  playerName: string = '';

  constructor(private router: Router) {}

  continue() {
    if (this.playerName.trim()) {
      console.log('Player Name:', this.playerName);
      this.router.navigate(['/host-or-join'], { queryParams: { playerName: this.playerName } });
    } else {
      alert('Please enter your name to continue.');
    }
  }
}