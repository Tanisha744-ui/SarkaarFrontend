import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

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
  autoCallEnabled: boolean = true; // Default ON
  showAutoCall: boolean = false; // State for Auto Call toggle
  autoCallPaused: boolean = true; // Add missing property
  autoCallInterval: any; // Add property to store interval ID
  currentNumber: string = "Waiting to start..."; // Default message before the game starts
  isGameStarted: boolean = false; // Track if the game has started
  showOfflineGameDialog: boolean = false; // Added property for dialog visibility
  offlineGameAutoCall: boolean = true; // Added property for Auto Call checkbox
  offlineGameCallingInterval: number = 3; // Added property for Calling Interval dropdown
  callingInterval: number = 3; // Default interval
  speakerModeEnabled: boolean = true; // New property for Speaker Mode

  constructor(private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      if (params['callingInterval']) {
        this.callingInterval = +params['callingInterval'];
      }
    });
  }

  ngOnInit() {
    const navigation = window.history.state;
    if (navigation && navigation.showDialog) {
      this.openOfflineGameDialog(); // Automatically open the dialog box if state indicates so
    }
  }

  proceedToNumberGeneration() {
    this.isNumberGenerationScreen = true;
    this.startButtonVisible = false; // Ensure the button is hidden after one click
  }

  toggleSpeakerMode() {
   // this.speakerModeEnabled = !this.speakerModeEnabled;
    if (this.speakerModeEnabled) {
      this.announceCurrentNumber();
    }
  }

  announceCurrentNumber() {
    // if (this.currentNumber !== "Waiting to start...") {
    //   const utterance = new SpeechSynthesisUtterance(`${this.currentNumber}`);
    //   window.speechSynthesis.speak(utterance);
    // }
  }

  generateRandomNumber() {
    if (this.randomNumbers.length >= 90) {
      console.log('All numbers have been generated.');
      clearInterval(this.autoCallInterval);
      return;
    }

    let newNumber;
    do {
      newNumber = Math.floor(Math.random() * 90) + 1;
    } while (this.randomNumbers.includes(newNumber));

    this.randomNumbers.push(newNumber);
    this.currentNumber = newNumber.toString(); // Update the current number
    console.log('Generated number:', newNumber);

    // if (this.speakerModeEnabled) {
    //   this.announceCurrentNumber();
    // }
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
    this.isGameStarted = true;
    this.showAutoCall = true;
    this.autoCallEnabled = true; // Auto Call is ON by default
    this.autoCallPaused = false; // Start Auto Call immediately
    this.randomNumbers = []; // Reset called numbers
    this.currentNumber = "Waiting to start..."; // Reset the current number
    this.isNumberGenerationScreen = true; // Show the number grid
    this.startAutoCall(this.callingInterval * 1000); // Use the selected interval
  }

  restartGame() {
    this.isGameStarted = false;
    this.showAutoCall = false;
    this.autoCallEnabled = false; // Reset Auto Call
    this.randomNumbers = []; // Clear all called numbers
    window.location.reload(); // Refresh the page to reset the state
  }

  toggleAutoCall() {
    this.autoCallEnabled = !this.autoCallEnabled;
  }

  onToggleClick(event: MouseEvent) {
    console.log('Input clicked:', event);
  }

  openOfflineGameDialog() {
    this.showOfflineGameDialog = true; // Show the dialog box
  }

  startOfflineGame() {
    this.showOfflineGameDialog = false; // Close the dialog box
    this.autoCallEnabled = this.offlineGameAutoCall; // Set Auto Call based on user input
    const interval = this.offlineGameCallingInterval * 1000; // Convert seconds to milliseconds
    if (this.autoCallEnabled) {
      this.startAutoCall(interval); // Start Auto Call with the selected interval
    }
  }

  startAutoCall(interval: number) {
    this.stopAutoCall(); // Ensure no duplicate intervals
    this.autoCallInterval = setInterval(() => {
      this.generateRandomNumber();
    }, interval); // Use the passed interval
  }

  stopAutoCall() {
    clearInterval(this.autoCallInterval);
  }

  // navigateToOffline() {
  //   console.log('Navigating to offline mode...');
  // }
}