import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tambola',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tambola.html',
  styleUrls: ['./tambola.css']
})
export class Tambola {
  numPlayers: number = 2;
  playerNames: string[] = [];

  constructor(private router: Router) {
    this.updatePlayerFields();
  }

  updatePlayerFields() {
    const currentLength = this.playerNames.length;
    if (this.numPlayers > currentLength) {
      // Add empty fields if numPlayers increases
      this.playerNames.push(...Array(this.numPlayers - currentLength).fill(''));
    } else if (this.numPlayers < currentLength) {
      // Remove extra fields if numPlayers decreases
      this.playerNames.splice(this.numPlayers);
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
  navigateToOffline() {
    this.router.navigate(['/tambola-game']);
  }
  areAllNamesValid(): boolean {
    return this.playerNames.every(name => name.trim().length >= 3);
  }

  startGame() {
    if (this.areAllNamesValid()) {
      this.router.navigate(['/tambola-game'], { queryParams: { players: this.numPlayers, names: this.playerNames } });
    } else {
      alert('Please ensure all player names are at least 3 characters long.');
    }
  }
}
