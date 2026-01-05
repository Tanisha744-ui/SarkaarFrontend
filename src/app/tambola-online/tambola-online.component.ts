import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tambola-online',
  templateUrl: './tambola-online.component.html',
  styleUrls: ['./tambola-online.component.css'],
  imports: [FormsModule]
})
export class TambolaOnlineComponent {
  playerName: string = '';

  continue() {
    if (this.playerName.trim()) {
      console.log('Player Name:', this.playerName);
      // Add navigation or further logic here
    } else {
      alert('Please enter your name to continue.');
    }
  }
}