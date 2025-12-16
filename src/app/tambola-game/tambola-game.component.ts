import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tambola-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tambola-game.html',
  styleUrls: ['./tambola-game.css']
})
export class TambolaGameComponent {
  numPlayers: number = 0;
  tickets: any[] = [];
  ticketAssignments: string[] = [];
  playerNames: string[] = [];
  randomNumbers: number[] = [];
  isNumberGenerationScreen: boolean = false;
  startButtonVisible: boolean = true; // New property to control 'Start' button visibility

  constructor() {
    // Initialize with some default values for testing
    this.numPlayers = 5;
    this.tickets = Array(5).fill(null).map((_, i) => `Ticket ${i + 1}`);
    this.ticketAssignments = Array(5).fill('');
    this.playerNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'];
  }

  proceedToNumberGeneration() {
    this.isNumberGenerationScreen = true;
    this.startButtonVisible = false; // Ensure the button is hidden after one click
  }

  generateRandomNumber() {
    if (this.randomNumbers.length >= 90) {
      console.log('All numbers have been generated.');
      return;
    }

    let newNumber;
    do {
      newNumber = Math.floor(Math.random() * 90) + 1;
    } while (this.randomNumbers.includes(newNumber));

    this.randomNumbers.push(newNumber);
    console.log('Generated number:', newNumber);
  }

  checkWinner() {
    for (let i = 0; i < this.tickets.length; i++) {
      const ticket = this.tickets[i];
      const isWinner = ticket.every((row: number[]) => row.every((cell: number | null) => cell === null || this.randomNumbers.includes(cell)));

      if (isWinner) {
        alert(`Player ${this.playerNames[i]} wins!`);
        return;
      }
    }
  }
}