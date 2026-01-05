import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tambola-game',
  standalone: true,
  imports: [CommonModule, FormsModule], // Ensure CommonModule and FormsModule are included
  templateUrl: './tambola-game.html',
  styleUrls: ['./tambola-game.css']
})
export class TambolaGame implements OnDestroy, OnInit {
  numPlayers: number = 0;
  playerNames: string[] = [];
  tickets: number[][][] = [];
  ticketAssignments: string[] = []; // Track ticket assignments
  randomNumbers: number[] = [];
  isNumberGenerationScreen: boolean = false;
  autoCallEnabled: boolean = false;
  private autoCallInterval: any;
  showAutoCall: boolean = false; // State for Auto Call toggle
  autoCallPaused: boolean = true; // Track pause/resume state
  currentNumber: string = "Waiting to start..."; // Default message before the game starts
  isGameStarted: boolean = false; // Track whether the game has started
  callingInterval: number = 3; // Default calling interval in seconds
  speakerModeEnabled: boolean = true; // Default Speaker Mode to ON

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe(params => {
      this.numPlayers = +params['players'] || 0;
      this.playerNames = Array.isArray(params['names']) ? params['names'] : (params['names'] ? [params['names']] : []);
      this.callingInterval = +params['interval'] || this.callingInterval; // Use the interval from query params if provided
      this.autoCallEnabled = params['autoCall'] === 'true'; // Respect the autoCall parameter

      if (this.numPlayers > 0) {
        this.generateTickets();
        this.assignTickets();
      }
    });
  }

  ngOnInit() {
    this.initializeGame();
    this.isNumberGenerationScreen = true; // Ensure the grid is always displayed

    // Ensure Speaker Mode is ON by default and announce the current number
    if (this.speakerModeEnabled) {
      this.announceCurrentNumber();
    }
  }

  initializeGame() {
    // Logic to generate grid and cards
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
    this.isNumberGenerationScreen = true;
  }

  toggleSpeakerMode() {
    // Correctly toggle the state on each click
    console.log('Before toggle:', this.speakerModeEnabled);
    this.speakerModeEnabled = !this.speakerModeEnabled;
    console.log('After toggle:', this.speakerModeEnabled);

    if (this.speakerModeEnabled) {
      this.announceCurrentNumber();
    }
  }

  announceCurrentNumber() {
    if (this.currentNumber !== "Waiting to start...") {
      const utterance = new SpeechSynthesisUtterance(`${this.currentNumber}`);
      window.speechSynthesis.speak(utterance);
    }
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
    this.currentNumber = newNumber.toString(); // Update the current number
    console.log('Generated number:', newNumber);

    if (this.speakerModeEnabled) {
      this.announceCurrentNumber();
    }
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

  startNewGame() {
    this.isGameStarted = true; // Mark the game as started
    this.showAutoCall = true;

    // Respect the autoCallEnabled value
    if (this.autoCallEnabled) {
      this.autoCallPaused = false; // Start Auto Call immediately
      this.startAutoCall(this.callingInterval * 1000); // Use the selected interval
    } else {
      this.autoCallPaused = true; // Ensure Auto Call remains paused
    }

    this.randomNumbers = []; // Reset called numbers
    this.currentNumber = "Waiting to start..."; // Reset the current number
    this.isNumberGenerationScreen = true; // Show the number grid
  }

  restartGame() {
    this.stopAutoCall(); // Stop any ongoing Auto Call
    this.isGameStarted = false; // Reset the game state
    this.showAutoCall = false;
    this.autoCallPaused = true; // Pause Auto Call
    this.randomNumbers = []; // Reset called numbers
    this.currentNumber = "Waiting to start..."; // Reset the current number
    this.isNumberGenerationScreen = false; // Hide the number grid
    this.generateTickets(); // Regenerate tickets for players
    this.assignTickets(); // Reassign tickets to players

    // Restore Auto Call based on the previous state
    if (this.autoCallEnabled) {
      this.startAutoCall(this.callingInterval * 1000); // Restart Auto Call if enabled
    }
  }

  toggleAutoCall() {
    console.log('Toggle clicked:', this.autoCallEnabled);
    if (!this.autoCallEnabled) {
      this.stopAutoCall(); // Stop Auto Call when toggled off
      this.autoCallPaused = true; // Ensure Auto Call is paused
    } else {
      this.autoCallPaused = !this.autoCallPaused;
      if (!this.autoCallPaused) {
        this.startAutoCall(this.callingInterval * 1000); // Resume with the selected interval
      } else {
        this.stopAutoCall();
      }
    }
  }

  startAutoCall(interval: number = this.callingInterval * 1000) {
    this.stopAutoCall(); // Ensure no duplicate intervals
    this.autoCallInterval = setInterval(() => {
      this.generateRandomNumber();
    }, interval); // Call with the specified interval
  }

  stopAutoCall() {
    clearInterval(this.autoCallInterval);
  }

  ngOnDestroy() {
    this.stopAutoCall(); // Ensure Auto Call is stopped when the component is destroyed
  }

  onToggleClick(event: MouseEvent) {
    console.log('Input clicked:', event);
  }

  navigateToOffline() {
    this.router.navigate(['/tambola-game']);
  }
}