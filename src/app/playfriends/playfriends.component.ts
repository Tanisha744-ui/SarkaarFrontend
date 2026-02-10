import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EndGameDialogComponent } from './end-game-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../services/signalr.service';
import { PartyService } from '../services/party.service';
import { WinnersDialogComponent } from './winners-dialog.component';

@Component({
  selector: 'app-playfriends',
  templateUrl: './playfriends.component.html',
  styleUrls: ['./playfriends.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PlayfriendsComponent implements OnInit {
            // Show Game Over dialog (WinnersDialogComponent) for all
            showGameOverDialog(): void {
              console.log('[DEBUG] showGameOverDialog called for', this.playerName);
              const dialogRef = this.dialog.open(WinnersDialogComponent, {
                width: '700px',
                panelClass: 'custom-dialog-bg',
                data: {
                  claimedbonuses: this.claimedbonuses,
                  bonusNameMap: this.bonusNameMap,
                  playerName: this.playerName
                }
              });
              dialogRef.componentInstance.goLobby.subscribe(async () => {
                dialogRef.close();
                if (this.isHost) {
                  this.endGame();
                } else {
                  await this.leaveParty();
                }
                // Navigation is handled in leaveParty() or endGame()
              });
            }
          // Helper for template to get object keys
          objectKeys = Object.keys;

          // Map bonus keys to display names
          bonusNameMap: { [key: string]: string } = {
            firstLine: 'First Line',
            secondLine: 'Second Line',
            thirdLine: 'Third Line',
            fullHouse: 'Full House',
            earlyFive: 'Early Five',
          };
        onbonusButtonClick(option: string) {
          if (this.disabledButtons[option]) {
            this.bannerBold = 'Sorry!';
            this.bannerMessage = 'This reward has already been claimed.';
            this.showBanner = true;
            clearTimeout(this.bannerTimeout);
            this.bannerTimeout = setTimeout(() => {
              this.showBanner = false;
            }, 3000);
            return;
          }
          this.onbonusOptionClick(option);
        }
      showBanner: boolean = false;
      bannerMessage: string = '';
      bannerBold: string = '';
      bannerTimeout: any;
    partyLocked: boolean = false;

    togglePartyLock() {
      this.partyLocked = !this.partyLocked;
      // Broadcast lock state to all clients and backend using SignalR
      this.signalRService.setPartyLockState(this.partyCode, this.partyLocked);
      localStorage.setItem('partyLocked_' + this.partyCode, this.partyLocked.toString());
      // Show banner
      if (this.partyLocked) {
        this.bannerBold = 'Game Locked';
        this.bannerMessage = 'Players can no longer join.';
      } else {
        this.bannerBold = 'Game Unlocked';
        this.bannerMessage = 'Players can now join.';
      }
      this.showBanner = true;
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = setTimeout(() => {
        this.showBanner = false;
      }, 3000);
    }
  partyCode: string = '';
  hostName: string = '';
  playerName: string = '';
  players: string[] = [];
  isHost: boolean = false;

  // Tambola ticket related
  tambolaTickets: { [player: string]: number[][] } = {}; // 3x9 grid per player
  markedNumbers: { [player: string]: boolean[][] } = {}; // 3x9 grid of marks

  // Tambola main matrix (number grid) state
  randomNumbers: number[] = [];
  
  // --- Tambola Game Controls, Current Number, and Called Numbers logic (from tambola-game.ts) ---
  // Only add properties and methods not already present in PlayfriendsComponent
  
  // Game state for controls/cards
  isGameStarted: boolean = false;
  status: string = 'Waiting';

  // Broadcast status to all clients
  sendStatusUpdate(newStatus: string) {
    if (this.isHost) {
      this.signalRService.sendStatusUpdate(this.partyCode, newStatus);
    }
  }
  showAutoCall: boolean = false;
  autoCallEnabled: boolean = false;
  autoCallPaused: boolean = true;
  autoCallInterval: any;
  currentNumber: string = "Waiting to start...";
  callingInterval: number = 3;
  speakerModeEnabled: boolean = true; // Default ON
  announceNumbersEnabled: boolean = true; // Default ON
  disabledButtons: { [key: string]: boolean } = {
    firstLine: false,
    secondLine: false,
    thirdLine: false,
    fullHouse: false,
    earlyFive: false,
  };

  // Helper to check if a line is fully marked for the current player
  isLineMarked(lineIdx: number): boolean {
    if (!this.tambolaTickets[this.playerName] || !this.markedNumbers[this.playerName]) return false;
    for (let col = 0; col < 9; col++) {
      const num = this.tambolaTickets[this.playerName][lineIdx][col];
      if (num !== 0 && !this.markedNumbers[this.playerName][lineIdx][col]) {
        return false;
      }
    }
    return true;
  }

  // Helper to check if all numbers are marked (for Full House)
  isFullHouseMarked(): boolean {
    if (!this.tambolaTickets[this.playerName] || !this.markedNumbers[this.playerName]) return false;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 9; col++) {
        const num = this.tambolaTickets[this.playerName][row][col];
        if (num !== 0 && !this.markedNumbers[this.playerName][row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  // Helper to check if any 5 numbers are marked (for Early Five)
  isEarlyFiveMarked(): boolean {
    if (!this.tambolaTickets[this.playerName] || !this.markedNumbers[this.playerName]) return false;
    let markedCount = 0;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 9; col++) {
        const num = this.tambolaTickets[this.playerName][row][col];
        if (num !== 0 && this.markedNumbers[this.playerName][row][col]) {
          markedCount++;
        }
      }
    }
    return markedCount >= 5;
  }
  
  // Utility to chunk called numbers into rows of 8 for display
  getCalledNumberRows(): number[][] {
    const numbers = this.randomNumbers.slice().reverse();
    const rows: number[][] = [];
    for (let i = 0; i < numbers.length; i += 8) {
      rows.push(numbers.slice(i, i + 8));
    }
    return rows;
  }

  // Persist and restore tambola ticket for the current player
  saveTicketToStorage(playerName: string) {
    if (this.tambolaTickets[playerName]) {
      localStorage.setItem('tambolaTicket_' + playerName, JSON.stringify(this.tambolaTickets[playerName]));
    }
  }
  

  loadTicketFromStorage(playerName: string): number[][] | null {
    const ticket = localStorage.getItem('tambolaTicket_' + playerName);
    if (ticket) {
      try {
        return JSON.parse(ticket);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Persist and restore marked numbers for the current player
  saveMarksToStorage(playerName: string) {
    if (this.markedNumbers[playerName]) {
      localStorage.setItem('tambolaMarks_' + playerName, JSON.stringify(this.markedNumbers[playerName]));
    }
  }

  loadMarksFromStorage(playerName: string): boolean[][] | null {
    const marks = localStorage.getItem('tambolaMarks_' + playerName);
    if (marks) {
      try {
        return JSON.parse(marks);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Persist and restore called numbers
  saveCalledNumbersToStorage() {
    localStorage.setItem('tambolaCalledNumbers_' + this.partyCode, JSON.stringify(this.randomNumbers));
  }

  loadCalledNumbersFromStorage(): number[] {
    const called = localStorage.getItem('tambolaCalledNumbers_' + this.partyCode);
    if (called) {
      try {
        return JSON.parse(called);
      } catch {
        return [];
      }
    }
    return [];
  }

  // Persist and restore status
  saveStatusToStorage() {
    localStorage.setItem('tambolaStatus_' + this.partyCode, this.status);
  }

  loadStatusFromStorage(): string {
    return localStorage.getItem('tambolaStatus_' + this.partyCode) || 'Waiting';
  }

  // Persist and restore isGameStarted
  saveIsGameStartedToStorage() {
    localStorage.setItem('tambolaIsGameStarted_' + this.partyCode, JSON.stringify(this.isGameStarted));
  }

  loadIsGameStartedFromStorage(): boolean {
    const val = localStorage.getItem('tambolaIsGameStarted_' + this.partyCode);
    if (val !== null) {
      try {
        return JSON.parse(val);
      } catch {
        return false;
      }
    }
    return false;
  }

  // Persist and restore showAutoCall
  saveShowAutoCallToStorage() {
    localStorage.setItem('tambolaShowAutoCall_' + this.partyCode, JSON.stringify(this.showAutoCall));
  }

  loadShowAutoCallFromStorage(): boolean {
    const val = localStorage.getItem('tambolaShowAutoCall_' + this.partyCode);
    if (val !== null) {
      try {
        return JSON.parse(val);
      } catch {
        return false;
      }
    }
    return false;
  }

  // Persist and restore disabledButtons and claimedbonuses
  savebonusStateToStorage() {
    localStorage.setItem('tambolaDisabledButtons_' + this.partyCode + '_' + this.playerName, JSON.stringify(this.disabledButtons));
    localStorage.setItem('tambolaClaimedbonuses_' + this.partyCode, JSON.stringify(this.claimedbonuses));
  }

  loadbonusStateFromStorage() {
    const disabled = localStorage.getItem('tambolaDisabledButtons_' + this.partyCode + '_' + this.playerName);
    if (disabled) {
      try {
        this.disabledButtons = JSON.parse(disabled);
      } catch {}
    }
    const claimed = localStorage.getItem('tambolaClaimedbonuses_' + this.partyCode);
    if (claimed) {
      try {
        this.claimedbonuses = JSON.parse(claimed);
      } catch {}
    }
  }

  getPlayerRows(): string[][] {
    const rows: string[][] = [];
    for (let i = 0; i < this.players.length; i += 2) {
      rows.push(this.players.slice(i, i + 2));
    }
    return rows;
  }

  startNewGame() {
    this.isGameStarted = true;
    this.saveIsGameStartedToStorage();
    this.sendStatusUpdate('In-progress');
    this.showAutoCall = true;
    this.saveShowAutoCallToStorage();
    if (this.autoCallEnabled) {
      this.autoCallPaused = false;
      this.startAutoCall(this.callingInterval * 1000);
    } else {
      this.autoCallPaused = true;
    }
    this.randomNumbers = [];
    this.currentNumber = "Waiting to start...";
    // Notify all clients that the game has started
    if (this.isHost) {
      this.signalRService.sendGameStarted(this.partyCode);
    }
  }
  
  restartGame() {
    this.isGameStarted = false;
    this.saveIsGameStartedToStorage();
    this.showAutoCall = false;
    this.saveShowAutoCallToStorage();
    this.autoCallPaused = true;
    this.randomNumbers = [];
    this.currentNumber = "Waiting to start...";
    this.disabledButtons = {
      firstLine: false,
      secondLine: false,
      thirdLine: false,
      fullHouse: false,
      earlyFive: false,
    };
    // Notify backend to reset game started state
    if (this.isHost) {
      this.signalRService.resetGameStarted(this.partyCode);
    }
  }
  
  toggleAutoCall() {
    if (!this.autoCallEnabled) {
      this.stopAutoCall();
      this.autoCallPaused = true;
    } else {
      this.autoCallPaused = !this.autoCallPaused;
      if (!this.autoCallPaused) {
        this.startAutoCall(this.callingInterval * 1000);
      } else {
        this.stopAutoCall();
      }
    }
  }
  
  startAutoCall(interval: number = this.callingInterval * 1000) {
    this.stopAutoCall();
    this.autoCallInterval = setInterval(() => {
      this.generateRandomNumber();
    }, interval);
  }
  
  stopAutoCall() {
    clearInterval(this.autoCallInterval);
  }
  
  toggleSpeakerMode() {
    // Toggle speaker mode and announce if enabled
    this.speakerModeEnabled = !this.speakerModeEnabled;
    if (this.speakerModeEnabled) {
      this.announceCurrentNumber();
    }
  }

  announceCurrentNumber() {
    // Announce the current number if not waiting
    if (this.currentNumber !== "Waiting to start...") {
      const utterance = new SpeechSynthesisUtterance(`${this.currentNumber}`);
      window.speechSynthesis.speak(utterance);
    }
  }
  
  onbonusOptionClick(option: string) {
    let eligible = false;
    if (option === 'firstLine') {
      eligible = this.isLineMarked(0);
    } else if (option === 'secondLine') {
      eligible = this.isLineMarked(1);
    } else if (option === 'thirdLine') {
      eligible = this.isLineMarked(2);
    } else if (option === 'fullHouse') {
      eligible = this.isFullHouseMarked();
    } else if (option === 'earlyFive') {
      eligible = this.isEarlyFiveMarked();
    }
    if (eligible) {
      this.disabledButtons[option] = true;
      this.savebonusStateToStorage();
      // Notify server and all clients via SignalR
      this.signalRService.claimbonusCard(this.partyCode, option, this.playerName);

      // Broadcast Full House claimed to all clients
      if (option === 'fullHouse') {
        console.log('[DEBUG] Full House claimed by', this.playerName, 'party:', this.partyCode);
        this.signalRService.sendFullHouseClaimed(this.partyCode);
        // Dialog will be shown via SignalR event for all
      }
    } else {
      this.bannerBold = 'Reward Locked \uD83D\uDD12';
      this.bannerMessage = 'Looks like this one isn\'t part of your eligibility yet.';
      this.showBanner = true;
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = setTimeout(() => {
        this.showBanner = false;
      }, 3000);
    }
  }
  // --- End Tambola Game logic ---

  // Copy party code to clipboard
  copyPartyCode(): void {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(this.partyCode);
    } else {
      // fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = this.partyCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    // Show styled floating banner to the user
    this.bannerBold = 'PARTY CODE COPIED 👍🏻';
    this.bannerMessage = 'You’re all set — go start the party! 🕺';
    this.showBanner = true;
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.showBanner = false;
    }, 5000);
  }

  // Generate a random tambola number (1-90) and add to randomNumbers
  generateRandomNumber(): void {
    if (this.randomNumbers.length >= 90) return;
    let newNumber;
    do {
      newNumber = Math.floor(Math.random() * 90) + 1;
    } while (this.randomNumbers.includes(newNumber));
    this.randomNumbers.push(newNumber);
    this.currentNumber = newNumber.toString();
    this.saveCalledNumbersToStorage();
    // Announce if speaker mode is enabled
    if (this.speakerModeEnabled) {
      this.announceCurrentNumber();
    }
    // If host, broadcast the updated numbers to all players
    if (this.isHost) {
      this.signalRService.sendCalledNumber(this.partyCode, this.randomNumbers);
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private signalRService: SignalRService,
    private partyService: PartyService,
    private dialog: MatDialog
  ) {}


  openEndGameDialog(): void {
    const dialogRef = this.dialog.open(EndGameDialogComponent, {
      width: '400px',
      disableClose: true,
      panelClass: 'custom-dialog-bg',
      data: {
        title: 'Are you sure?',
        content: 'This will permanently end the game for everyone and close the room. This action cannot be undone.',
        confirmText: 'Yes, End Game'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.endGame();
      }
    });
  }

  openLeavePartyDialog(): void {
    const dialogRef = this.dialog.open(EndGameDialogComponent, {
      width: '400px',
      disableClose: true,
      panelClass: 'custom-dialog-bg',
      data: {
        title: 'Leave Party?',
        content: 'Are you sure you want to leave this party? You will be removed from the room, but the game will continue for others.',
        confirmText: 'Yes, Leave Party'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.leaveParty();
      }
    });
  }

  async leaveParty(): Promise<void> {
    // Remove from SignalR group and update player list for all
    await this.signalRService.leaveParty(this.partyCode, this.playerName);
    this.clearPartyLocalStorage();
    if (!this.partyCode) {
      this.router.navigate(['/host-or-join'], { queryParams: { playerName: this.playerName } });
      return;
    }
    this.partyService.removePlayer(this.partyCode, this.playerName).subscribe({
      next: () => {
        this.router.navigate(['/host-or-join'], { queryParams: { playerName: this.playerName } });
      },
      error: () => {
        this.router.navigate(['/host-or-join'], { queryParams: { playerName: this.playerName } });
      }
    });
  }

  endGame(): void {
    // Signal all clients to end game and clear their localStorage
    if (this.isHost) {
      this.signalRService.sendEndGame(this.partyCode);
    }
    // Clear all localStorage for this party and player
    this.clearPartyLocalStorage();
    // Call backend to delete party and players
    if (!this.partyCode) {
      this.router.navigate(['/host-or-join'], { queryParams: { playerName: this.playerName } });
      return;
    }
    this.partyService.endGame(this.partyCode).subscribe({
      next: () => {
        this.router.navigate(['/host-or-join'], { queryParams: { playerName: this.playerName } });
      },
      error: () => {
        // Optionally show error to user
        this.router.navigate(['/host-or-join'], { queryParams: { playerName: this.playerName } });
      }
    });
  }
  // Navigate to host-or-join page
  goToHostOrJoin(): void {
    this.router.navigate(['/host-or-join']);
  }
  // Track claimed bonus cards: { [bonusType]: playerName }
  claimedbonuses: { [key: string]: string } = {};
  async ngOnInit() {
        // Listen for game restarted event (all clients)
        this.signalRService.onGameRestarted(() => {
          this.isGameStarted = false;
          this.saveIsGameStartedToStorage();
          this.bannerBold = 'Game Restarted';
          this.bannerMessage = 'A new game can now be joined!';
          this.showBanner = true;
          clearTimeout(this.bannerTimeout);
          this.bannerTimeout = setTimeout(() => {
            this.showBanner = false;
          }, 3500);
        });
    // Debug: Log ngOnInit start
    console.log('[DEBUG] ngOnInit called for', this.playerName, 'party:', this.partyCode);

    // Optionally, restore lock state from localStorage (for host)
    const storedLock = localStorage.getItem('partyLocked_' + this.partyCode);
    if (storedLock !== null) {
      this.partyLocked = storedLock === 'true';
    }
    this.partyCode = this.route.snapshot.queryParamMap.get('partyCode') || '';
    this.hostName = this.route.snapshot.queryParamMap.get('hostName') || '';
    this.playerName = this.route.snapshot.queryParamMap.get('playerName') || '';
    this.isHost = this.route.snapshot.queryParamMap.get('isHost') === 'true';

    // Restore called numbers and status from storage
    this.randomNumbers = this.loadCalledNumbersFromStorage();
    if (this.randomNumbers && this.randomNumbers.length > 0) {
      this.currentNumber = this.randomNumbers[this.randomNumbers.length - 1].toString();
    } else {
      this.currentNumber = "Waiting to start...";
    }
    this.status = this.loadStatusFromStorage();

    // Restore isGameStarted from storage
    this.isGameStarted = this.loadIsGameStartedFromStorage();

    // Restore showAutoCall from storage
    this.showAutoCall = this.loadShowAutoCallFromStorage();

    // Ensure the current player always gets a ticket (persisted)
    if (this.playerName && !this.tambolaTickets[this.playerName]) {
      const storedTicket = this.loadTicketFromStorage(this.playerName);
      if (storedTicket) {
        this.tambolaTickets[this.playerName] = storedTicket;
      } else {
        this.tambolaTickets[this.playerName] = this.generateTambolaTicket();
        this.saveTicketToStorage(this.playerName);
      }
      // Restore marks if present
      const storedMarks = this.loadMarksFromStorage(this.playerName);
      if (storedMarks) {
        this.markedNumbers[this.playerName] = storedMarks;
      } else {
        this.markedNumbers[this.playerName] = Array.from({ length: 3 }, () => Array(9).fill(false));
      }
    }

    // Restore bonus state from storage
    this.loadbonusStateFromStorage();
    // If joinee and status is In-progress, set isGameStarted = true
    if (!this.isHost && this.status === 'In-progress') {
      this.isGameStarted = true;
    }
    // Show lobby banner for non-host joinees entering the lobby
    if (!this.isHost && this.status !== 'In-progress') {
      this.bannerBold = 'You’re all set in the lobby🙌🏻';
      this.bannerMessage = 'The host will start the fun soon…';
      this.showBanner = true;
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = setTimeout(() => {
        this.showBanner = false;
      }, 5000);
    }

    // Start SignalR connection and join party group (await both in order)
    try {
      await this.signalRService.startConnection();
      await this.signalRService.joinParty(this.partyCode, this.playerName);
      // Debug: Log after joinParty
      console.log('[DEBUG] Joined SignalR group for party:', this.partyCode, 'as', this.playerName);
    } catch (err: any) {
      // Show banner for invalid party code
      this.bannerBold = 'Invalid Party Code';
      this.bannerMessage = 'No party found with this code. Please check and try again.';
      this.showBanner = true;
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = setTimeout(() => {
        this.showBanner = false;
        this.router.navigate(['/host-or-join']);
      }, 3500);
      return;
    }

    // Listen for Full House claimed event and show Game Over dialog for all
    this.signalRService.onFullHouseClaimed(() => {
      console.log('[DEBUG] Received Full House SignalR event in', this.playerName);
      this.showGameOverDialog();
    });

    // Register SignalR event handlers only after connection is established
    // Listen for already claimed bonus event from server
    this.signalRService.onbonusCardAlreadyClaimed((bonusType: string, claimedBy: string) => {
      this.bannerBold = 'Sorry!';
      this.bannerMessage = `This reward has already been claimed.`;
      this.showBanner = true;
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = setTimeout(() => {
        this.showBanner = false;
      }, 3000);
    });
    // Listen for bonus card claims from other players
    this.signalRService.onbonusCardClaimed((bonusType: string, playerName: string) => {
      this.claimedbonuses[bonusType] = playerName;
      this.disabledButtons[bonusType] = true;
      this.savebonusStateToStorage();
      // Show styled floating banner to everyone
      const bonusDisplay = (bonusType.replace(/([A-Z])/g, ' $1').trim().toUpperCase()) + ' Reward Claimed🔥';
      this.bannerBold = bonusDisplay;
      this.bannerMessage = `${playerName}, leave some luck for others!`;
      this.showBanner = true;
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = setTimeout(() => {
        this.showBanner = false;
      }, 5000);
    });

    // Listen for game started event (host triggers for all clients)
    this.signalRService.onGameStarted(() => {
      this.isGameStarted = true;
      // Show banner for joinees only
      if (!this.isHost) {
        this.bannerBold = 'GAME ON!';
        this.bannerMessage = 'LET THE NUMBERS FALL IN YOUR FAVOR! 🎉';
        this.showBanner = true;
        clearTimeout(this.bannerTimeout);
        this.bannerTimeout = setTimeout(() => {
          this.showBanner = false;
        }, 5000);
      }
    });

      // Listen for end game event from host
      this.signalRService.onEndGame(() => {
        // Show Game Over dialog for all clients (host and joinees)
        // this.showGameOverDialog();
        // Show banner for joinees
        if (!this.isHost) {
          this.bannerBold = 'Game Ended !';
          this.bannerMessage = 'The host has ended the game.';
          this.showBanner = true;
          clearTimeout(this.bannerTimeout);
          this.bannerTimeout = setTimeout(() => {
            this.showBanner = false;
          }, 5000);
          // Redirect to host-or-join, preserving playerName
          setTimeout(() => {
            this.router.navigate(['/host-or-join'], { queryParams: { playerName: this.playerName, banner: 'host-ended' } });
          }, 3000); // Give time for dialog/banner
        }
      });


    // Defer join restriction logic until after player list is received
    let checkedPlayerList = false;
    this.signalRService.onPlayerListUpdated((players: string[]) => {
      this.players = players;
      // Ensure tickets for all players
      this.players.forEach(player => {
        if (!this.tambolaTickets[player]) {
          this.tambolaTickets[player] = this.generateTambolaTicket();
          this.markedNumbers[player] = Array.from({ length: 3 }, () => Array(9).fill(false));
        }
      });
      // Only check join restriction after first player list update
      if (!checkedPlayerList) {
        checkedPlayerList = true;
        if ((this.partyLocked || this.isGameStarted) && !this.players.includes(this.playerName)) {
          this.bannerBold = this.partyLocked ? 'Party Locked \uD83D\uDD12' : 'Game In Progress';
          this.bannerMessage = this.partyLocked
            ? 'Party is locked. You cannot join at this time.'
            : 'Game has already started. Please wait for the next game!';
          this.showBanner = true;
          clearTimeout(this.bannerTimeout);
          this.bannerTimeout = setTimeout(() => {
            this.showBanner = false;
            this.router.navigate(['/host-or-join']);
          }, 3500);
        }
      }
    });

    // Listen for real-time player list updates
    this.signalRService.onPlayerListUpdated((players: string[]) => {
      this.players = players;
      // Ensure tickets for all players
      this.players.forEach(player => {
        if (!this.tambolaTickets[player]) {
          this.tambolaTickets[player] = this.generateTambolaTicket();
          this.markedNumbers[player] = Array.from({ length: 3 }, () => Array(9).fill(false));
        }
      });
    });

    // (Removed: Host-side manual push and broadcast of player list. Now only server manages and broadcasts the list.)
    // Listen for called numbers if not host
    if (!this.isHost) {
      this.signalRService.onCalledNumbers((numbers: number[]) => {
        this.randomNumbers = numbers;
        this.saveCalledNumbersToStorage();
        if (numbers && numbers.length > 0) {
          this.currentNumber = numbers[numbers.length - 1].toString();
        } else {
          this.currentNumber = "Waiting to start...";
        }
      });
    }
      // Listen for status updates from host (or self)
      this.signalRService.onStatusUpdate((newStatus: string) => {
        console.log('[SignalR] Status update received:', newStatus);
        this.status = newStatus;
        this.saveStatusToStorage();
        // If joinee and status is In-progress, set isGameStarted = true
        if (!this.isHost && newStatus === 'In-progress') {
          this.isGameStarted = true;
        }
      });
    // (Removed: Fetching initial party details from PartyService, as it overwrites the real-time SignalR list. Only use the SignalR list for the Players card.)
  }

  // Generate a valid Tambola ticket (3x9 grid, 15 numbers, 5 per row, 1-3 per column, correct placement)
  generateTambolaTicket(): number[][] {
    // Step 1: Prepare column ranges
    const columns: number[][] = [];
    for (let i = 0; i < 9; i++) {
      const start = i === 0 ? 1 : i * 10;
      const end = i === 8 ? 90 : i * 10 + 9;
      const nums = [];
      for (let n = start; n <= end; n++) nums.push(n);
      columns.push(nums);
    }

    // Step 2: Decide how many numbers per column (1-3 per column, total 15)
    let colCounts = Array(9).fill(1); // Start with 1 per column
    let remaining = 15 - 9; // 6 left to distribute
    while (remaining > 0) {
      const idx = Math.floor(Math.random() * 9);
      if (colCounts[idx] < 3) {
        colCounts[idx]++;
        remaining--;
      }
    }

    // Step 3: Build a row assignment matrix (3x9) with exactly 5 per row and colCounts per column
    // This is a tricky constraint satisfaction problem. We'll use a retry loop to guarantee a valid assignment.
    let rowMatrix: number[][] = Array.from({ length: 3 }, () => Array(9).fill(0));
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 100) {
      // Reset rowMatrix each attempt
      rowMatrix = Array.from({ length: 3 }, () => Array(9).fill(0));
      let rowFill = [0, 0, 0];
      let colFill = Array(9).fill(0);
      // For each row, randomly pick 5 columns to fill
      for (let r = 0; r < 3; r++) {
        // Get columns that still need numbers
        let availableCols = [];
        for (let c = 0; c < 9; c++) {
          if (colFill[c] < colCounts[c]) availableCols.push(c);
        }
        // If not enough available columns, restart
        if (availableCols.length < 5) break;
        // Shuffle and pick 5
        for (let i = availableCols.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availableCols[i], availableCols[j]] = [availableCols[j], availableCols[i]];
        }
        let chosen = availableCols.slice(0, 5);
        for (let c of chosen) {
          rowMatrix[r][c] = 1;
          rowFill[r]++;
          colFill[c]++;
        }
      }
      // Check if all columns are satisfied
      valid = colFill.every((v, i) => v === colCounts[i]);
      attempts++;
    }
    if (!valid) {
      // Fallback: fill left to right
      rowMatrix = Array.from({ length: 3 }, () => Array(9).fill(0));
      let colFill = Array(9).fill(0);
      for (let r = 0; r < 3; r++) {
        let filled = 0;
        for (let c = 0; c < 9 && filled < 5; c++) {
          if (colFill[c] < colCounts[c]) {
            rowMatrix[r][c] = 1;
            colFill[c]++;
            filled++;
          }
        }
      }
    }

    // Step 4: For each column, pick random numbers and assign to the rows
    const grid: number[][] = Array.from({ length: 3 }, () => Array(9).fill(0));
    for (let col = 0; col < 9; col++) {
      // Pick colCounts[col] numbers from the column's range
      const colNums: number[] = [];
      const colPool = [...columns[col]];
      for (let i = 0; i < colCounts[col]; i++) {
        const idx = Math.floor(Math.random() * colPool.length);
        colNums.push(colPool.splice(idx, 1)[0]);
      }
      colNums.sort((a, b) => a - b);
      // Assign to the rows in order where rowMatrix[row][col] == 1
      let numIdx = 0;
      for (let row = 0; row < 3; row++) {
        if (rowMatrix[row][col] === 1) {
          grid[row][col] = colNums[numIdx++];
        }
      }
    }

    return grid;
  }
    // Mark/unmark a number on the ticket for the current player
  toggleMark(rowIdx: number, colIdx: number): void {
    if (!this.tambolaTickets[this.playerName]) return;
    const num = this.tambolaTickets[this.playerName][rowIdx][colIdx];
    if (num === 0) return; // Don't mark blanks
    // Only allow marking if the number is in the called numbers list
    if (!this.randomNumbers.includes(num)) return;
    this.markedNumbers[this.playerName][rowIdx][colIdx] = !this.markedNumbers[this.playerName][rowIdx][colIdx];
    this.saveMarksToStorage(this.playerName);
  }

  closeBanner() {
    this.showBanner = false;
    clearTimeout(this.bannerTimeout);
  }

  // Utility to clear all localStorage for this party and player
  clearPartyLocalStorage() {
    // Remove ticket and marks for this player
    localStorage.removeItem('tambolaTicket_' + this.playerName);
    localStorage.removeItem('tambolaMarks_' + this.playerName);
    // Remove called numbers, status, isGameStarted, showAutoCall, bonus state for this party
    localStorage.removeItem('tambolaCalledNumbers_' + this.partyCode);
    localStorage.removeItem('tambolaStatus_' + this.partyCode);
    localStorage.removeItem('tambolaIsGameStarted_' + this.partyCode);
    localStorage.removeItem('tambolaShowAutoCall_' + this.partyCode);
    localStorage.removeItem('tambolaDisabledButtons_' + this.partyCode + '_' + this.playerName);
    localStorage.removeItem('tambolaClaimedbonuses_' + this.partyCode);
    localStorage.removeItem('partyLocked_' + this.partyCode);
  }
}
