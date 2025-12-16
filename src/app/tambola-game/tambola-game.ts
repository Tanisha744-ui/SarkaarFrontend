import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tambola-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tambola-game.html',
  styleUrls: ['./tambola-game.css']
})
export class TambolaGame {
  numPlayers: number = 0;
  playerNames: string[] = [];
  tickets: number[][][] = [];
  ticketAssignments: string[] = []; // Track ticket assignments
  randomNumbers: number[] = [];
  isNumberGenerationScreen: boolean = false;
  startButtonVisible: boolean = true; // Add this line

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      this.numPlayers = +params['players'] || 0;
      this.playerNames = Array.isArray(params['names']) ? params['names'] : (params['names'] ? [params['names']] : []);
      if (this.numPlayers > 0) {
        this.generateTickets();
        this.assignTickets();
      }
    });
  }

  generateTickets() {
    this.tickets = Array.from({ length: this.numPlayers }, () => this.generateTicket());
  }

  generateTicket(): number[][] {
    const ticket: number[][] = Array.from({ length: 3 }, () => Array(9).fill(null));
    const columns: number[][] = Array.from({ length: 9 }, (_, i) => {
      const start = i * 10 + 1;
      const end = i === 8 ? 90 : start + 9;
      return Array.from({ length: end - start + 1 }, (_, j) => start + j);
    });

    for (let row = 0; row < 3; row++) {
      let numbersInRow = 0;
      while (numbersInRow < 5) {
        const colIndex = Math.floor(Math.random() * 9);
        if (ticket[row][colIndex] === null && columns[colIndex].length > 0) {
          const randomIndex = Math.floor(Math.random() * columns[colIndex].length);
          ticket[row][colIndex] = columns[colIndex].splice(randomIndex, 1)[0];
          numbersInRow++;
        }
      }
    }

    return ticket;
  }

  assignTickets() {
    // Ensure every player is assigned a ticket
    this.ticketAssignments = this.playerNames.map((player, index) => {
        return this.tickets[index] ? player : '';
    });
  }

  proceedToNumberGeneration() {
    this.startButtonVisible = false;
    this.isNumberGenerationScreen = true;
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