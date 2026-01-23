import { Component, ViewChild } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { TeamcardOnline } from '../teamcard-online/teamcard-online';
import { Timer } from '../timer/timer';
import { HttpClient } from '@angular/common/http';
import { SarkaarRoomService } from '../services/sarkaar-room.service';
import { BidService, BidDto } from '../services/bid.service';
import { BidSignalRService } from '../services/bid-signalr.service';
import { API_BASE } from '../api.config';
import { FormsModule } from '@angular/forms';
import { LoaderComponent } from '../shared/loader/loader.component';
import { ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';

interface TeamData {
  teamId: string;
  name: string;
  balance: number;
  currentBid?: number;
  gameId?: number;
  id?: number; // real DB team id
}

@Component({
  selector: 'app-landingpage-online',
  imports: [TeamcardOnline, NgFor, NgIf, NgClass, Timer, FormsModule, LoaderComponent],
  templateUrl: './landingpage-online.html',
  styleUrl: './landingpage-online.css',
  standalone: true
})
export class LandingpageOnlineComponent {
  isLoading: boolean = true;
  loadingMessage: string = 'Loading...';
  // Toaster state
  toasterMessage: string | null = null;
  toasterTimeout: any = null;
  teams: TeamData[] = [];
  bidInterval: number = 10;
  winnerModalOpen = false;
  winnerTeam: TeamData | null = null;
  hasPlayedAtLeastOneRound = false;
  isOnline: boolean = false;
  gameControls: any = null;
  isGameLocked: boolean = false;
  activeTeam: string | null = null;
  @ViewChild('roundTimer') roundTimer?: Timer;
  isProcessingResult = false;
  results: Record<string, 'none' | 'correct' | 'wrong'> = {};
  endGameConfirmOpen = false;
  isHost = false;
  isChatOpen: boolean = false;
  chatMessages: { sender: string; text: string }[] = [];
  newChatMessage: string = '';

  filteredTeams: TeamData[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private sarkaarRoomService: SarkaarRoomService,
    private bidService: BidService,
    private bidSignalR: BidSignalRService
  ) { }

  ngOnInit() {
    this.isHost = sessionStorage.getItem('isHost') === 'true'
      || sessionStorage.getItem('isHost') === '1';

    const storedStep = sessionStorage.getItem('stepCount');
    if (storedStep) {
      const parsed = parseInt(storedStep, 10);
      if (!isNaN(parsed) && parsed > 0) {
        this.bidInterval = parsed;
      }
    }
    // Detect online mode by checking if roomCode exists
    this.isOnline = !!sessionStorage.getItem('roomCode');

    const gameCode = sessionStorage.getItem('roomCode');

    if (!gameCode) {
      console.error('Room code is missing. Cannot fetch teams.');
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Loading teams...';

    // Fetch teams from backend
    this.http.get<any[]>(`${API_BASE}/api/Team/bycode/${gameCode}`).subscribe({
      next: (teams) => {
        this.teams = teams.map((t, idx) => ({
          teamId: String.fromCharCode(65 + idx),
          name: t.name,
          balance: 100000,
          currentBid: undefined,
          gameId: 0,
          id: t.id
        }));

        // Ensure hostTeamId is set correctly
        let hostTeamId = sessionStorage.getItem('hostTeamId');
        if (!hostTeamId) {
          if (this.isHost && this.teams.length > 0) {
            hostTeamId = this.teams[0].teamId; // Assume the first team belongs to the host
            sessionStorage.setItem('hostTeamId', hostTeamId);
            console.log('Default Host Team ID set to:', hostTeamId);
          } else if (this.teams.length > 0) {
            // Attempt to infer hostTeamId for non-host users
            hostTeamId = this.teams[0].teamId; // Assume the first team belongs to the host
            sessionStorage.setItem('hostTeamId', hostTeamId);
            console.log('Inferred Host Team ID for non-host user:', hostTeamId);
          } else {
            console.error('Unable to set Host Team ID dynamically because the teams array is empty.');
          }
        }

        // Update filteredTeams after ensuring hostTeamId
        this.filteredTeams = this.getVisibleTeams();
        this.cdr.detectChanges(); // Force template update

        console.log('Teams fetched:', this.teams);
        console.log('Filtered Teams:', this.filteredTeams);

        // Initialize bids and SignalR updates
        this.initBidsAndSignalR();

        // Initialize chat updates
        this.initChatUpdates();

        // Fetch initial chat messages
        const roomCode = sessionStorage.getItem('roomCode');
        if (roomCode) {
          this.bidSignalR.fetchChatMessages(roomCode).subscribe({
            next: (messages) => {
              console.log('Initial chat messages fetched:', messages);
              this.chatMessages = messages;
            },
            error: (err) => {
              console.error('Failed to fetch chat messages:', err);
            }
          });
        }
      },
      error: (err) => {
        console.error('Failed to fetch teams:', err);
        this.showToaster('Failed to fetch teams. Please try again.');
      },
      complete: () => {
        this.isLoading = false;
        this.loadingMessage = '';
      }
    });

    // Fetch game controls
    this.sarkaarRoomService.getGameControls(gameCode).subscribe({
      next: (controls) => {
        this.gameControls = controls;
      },
      error: (err) => {
        this.gameControls = null;
      }
    });
  }

  private initBidsAndSignalR() {
    // Fetch initial bids from the backend
    this.bidService.getBids().subscribe((bids: BidDto[]) => {
      console.log('Initial bids fetched:', bids);

      // Map bids to teams
      for (const bid of bids) {
        const team = this.teams.find(t => t.id === bid.teamId);
        if (team) {
          team.currentBid = bid.amount;
          team.gameId = bid.gameId;
        }
      }

      // Start SignalR connection for real-time updates
      const gameId = bids[0]?.gameId;
      if (gameId) {
        this.bidSignalR.startConnection(gameId);
      }
    });

    // Subscribe to real-time bid updates
    this.bidSignalR.bidReceived$.subscribe((bid) => {
      console.log('Real-time bid received:', bid);
      const team = this.teams.find(t => t.id === bid.teamId);
      if (team) {
        team.currentBid = bid.amount;
        team.gameId = bid.gameId;
      }
    });
  }

  private initChatUpdates() {
    // Subscribe to real-time chat updates
    this.bidSignalR.chatReceived$.subscribe((message: { sender: string; text: string }) => {
      console.log('Real-time chat message received:', message);
      this.chatMessages.push(message);
    });
  }

  fetchBidsFromBackend() {
    this.bidService.getBids().subscribe({
      next: (bids: BidDto[]) => {
        // Map backend bids to teams
        for (const bid of bids) {
          const team = this.teams.find(t => t.id === bid.teamId);
          if (team) {
            team.currentBid = bid.amount;
            team.gameId = bid.gameId;
          }
        }
        // const gameId = bids[0]?.gameId;
        // if (gameId) {
        //   this.bidSignalR.startConnection(gameId);
        // }
      }
    });
  }
  isSpectator(): boolean {
  return sessionStorage.getItem('isSpectator') === 'true';
}

  canEditTeam(team: TeamData): boolean {
    if(this.isSpectator()) return false;
    const myTeamName = sessionStorage.getItem('myTeamName');
    if(!myTeamName) return false; 
    return team.name===myTeamName;
  }

  canLock(): boolean {
    const hostTeamId = sessionStorage.getItem('hostTeamId');

    // Exclude the host's team from the bid validation logic
    const nonHostTeams = this.teams.filter((team) => team.teamId !== hostTeamId);
    const bids = nonHostTeams.map((t: TeamData) => t.currentBid);

    // All non-host teams must have entered a bid (including zero)
    if (bids.some((b: number | undefined | null) => b === undefined || b === null)) return false;

    // Find all non-zero bids
    const nonZeroBids = bids.filter((b: number | undefined | null) => typeof b === 'number' && b > 0) as number[];
    if (nonZeroBids.length === 0) return false; // At least one non-zero bid required

    // The maximum non-zero bid must be unique
    const max = Math.max(...nonZeroBids);
    const maxCount = nonZeroBids.filter((b: number) => b === max).length;
    return maxCount === 1;
  }

  getMinimumBid(teamId: string): number {
    // Find the current max non-zero bid among other teams
    const otherBids = this.teams.filter((t: TeamData) => t.teamId !== teamId).map((t: TeamData) => t.currentBid ?? 0);
    const maxOtherBid = Math.max(0, ...otherBids.filter((b: number) => b > 0));
    return maxOtherBid + this.bidInterval;
  }

  onBidPlaced(amount: number, teamId: string) {
    const team = this.teams.find(t => t.teamId === teamId);
    if (!team || !team.id) return;
    if (!this.canEditTeam(team)) {
      console.warn('Blocked bid attempt for team:', team.name);
      return;
    }

    if (amount !== 0) {
      const minBid = this.getMinimumBid(teamId);
      if (amount < minBid) {
        this.showToaster(`Bid must be at least ${minBid}`);
        return;
      }
    }

    // Show full-page loader
    this.isLoading = true;
    this.loadingMessage = 'Placing bid...';

    this.bidService.createBid({
      teamId: team.id,
      amount,
      gameId: team.gameId ?? 0
    }).subscribe({
      error: err => {
        console.error('Bid create error:', err);
        this.isLoading = false; // Hide loader on error
      },
      next: () => {
        // Broadcast bid via SignalR for real-time update
        this.bidSignalR.sendBid({
          gameId: team.gameId ?? 0,
          teamId: team.id!,
          amount
        });
        // After placing bid, fetch latest bids from backend
        this.fetchBidsFromBackend();
        this.isLoading = false; // Hide loader after completion
      }
    });
  }


  showToaster(message: string) {
    this.toasterMessage = message;
    if (this.toasterTimeout) {
      clearTimeout(this.toasterTimeout);
    }
    this.toasterTimeout = setTimeout(() => {
      this.toasterMessage = null;
    }, 4500);
  }

  closeToaster() {
    this.toasterMessage = null;
    if (this.toasterTimeout) {
      clearTimeout(this.toasterTimeout);
      this.toasterTimeout = null;
    }
  }

  onTimerFinished() {
    // If timer finishes while bids are locked, auto-mark as wrong for active team
    if (this.isGameLocked && this.activeTeam) {
      console.log('Timer expired: auto-marking wrong for', this.activeTeam);
      this.handleAnswer(false, this.activeTeam);
    }
  }

  lockBids() {
    if (!this.canLock() || this.isGameLocked) return;
    // finding team with highest bid
    let max = -Infinity;
    let winner: TeamData | null = null;
    for (const t of this.teams) {
      if ((t.currentBid || 0) > max) {
        max = t.currentBid || 0;
        winner = t;
      }
    }
    if (winner) {
      this.isGameLocked = true;  // shows timer
      this.activeTeam = winner.teamId;
    }
  }

  handleAnswer(correct: boolean, teamId: string) {
    if (this.isProcessingResult) return;
    const team = this.teams.find((t: TeamData) => t.teamId === teamId);
    if (!team) return;
    const bidAmount = team.currentBid || 0;

    this.isProcessingResult = true;

    this._setResultState(teamId, correct ? 'correct' : 'wrong');

    // Wait for animation(yellow or green for incorrect or correct ), then apply balance change and reset UI
    setTimeout(() => {
      if (correct) {
        team.balance += bidAmount;
      } else {
        team.balance -= bidAmount;
      }

      this.teams.forEach((t: TeamData) => t.currentBid = 0);
      this.isGameLocked = false;
      this.activeTeam = null;
      if (this.roundTimer) {
        this.roundTimer.reset();
      }

      this.isProcessingResult = false;
      this.hasPlayedAtLeastOneRound = true;
    }, 3000);
  }

  private _setResultState(teamId: string, state: 'correct' | 'wrong') {
    this.results[teamId] = state;
    setTimeout(() => {
      this.results[teamId] = 'none';
    }, 3000);
  }

  showWinner() {
    // Find team with max balance (the actual winner of the game)
    let maxBalance = Math.max(...this.teams.map((t: TeamData) => t.balance));
    let winners = this.teams.filter((t: TeamData) => t.balance === maxBalance);
    this.winnerTeam = winners.length > 0 ? winners[0] : null;
    this.winnerModalOpen = true;
  }

  closeWinnerModal() {
    this.winnerModalOpen = false;
    this.winnerTeam = null;
  }

  openEndGameConfirm() {
    this.endGameConfirmOpen = true;
  }

  cancelEndGame() {
    this.endGameConfirmOpen = false;
  }

  confirmEndGame() {
    const gameCode = sessionStorage.getItem('roomCode');
    console.log('Deleting teams for gameCode:', gameCode);
    if (gameCode) {
      this.http.delete(`${API_BASE}/api/Team/bycode/${gameCode}`).subscribe({
        next: () => {
          sessionStorage.removeItem('roomCode');
          window.location.href = '/index';
        },
        error: () => {
          this.showToaster('Failed to end game.');
        }
      });
    } else {
      window.location.href = '/index';
    }
    this.endGameConfirmOpen = false;
  }

  // Toggles the chat dropdown visibility
toggleChatDropdown() {
  this.isChatOpen = !this.isChatOpen;
}

// Sends a new chat message
sendMessage() {
  if (this.newChatMessage.trim()) {
    const roomCode = sessionStorage.getItem('roomCode');
    if (!roomCode) {
      console.error('Room code not found. Cannot send message.');
      return;
    }

    const message = {
      roomCode,
      sender: sessionStorage.getItem('myTeamName') || 'Unknown',
      text: this.newChatMessage.trim()
    };

    this.chatMessages.push(message);
    this.newChatMessage = '';

    // Send message via SignalR and HTTP
    this.bidSignalR.sendChatMessage(message);
  }
}

// Add event listener for Enter key to send chat message
onChatInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    this.sendMessage();
    event.preventDefault(); // Prevent default Enter behavior
  }
}

getGridColumns(teamCount: number): string {
  if (teamCount <= 2) {
    return 'repeat(2, 1fr)';
  } else if (teamCount === 3) {
    return 'repeat(3, 1fr)';
  } else {
    return 'repeat(auto-fit, minmax(200px, 1fr))';
  }
}

getVisibleTeams(): TeamData[] {
    let hostTeamId = sessionStorage.getItem('hostTeamId');

    if (!hostTeamId) {
      console.warn('Host Team ID is missing during filtering. Attempting to set dynamically.');

      if (this.isHost) {
        if (this.teams.length > 0) {
          hostTeamId = this.teams[0].teamId; // Assume the first team belongs to the host
          sessionStorage.setItem('hostTeamId', hostTeamId);
          console.log('Dynamically set Host Team ID to:', hostTeamId);
        } else {
          console.error('Unable to set Host Team ID dynamically because the teams array is empty.');
          return []; // Return an empty array if teams are not available
        }
      } else {
        console.warn('Unable to set Host Team ID dynamically for non-host users. Defaulting to show all teams.');
        return this.teams;
      }
    }

    console.log('Host Team ID:', hostTeamId);
    console.log('All Teams:', this.teams);

    // Filter teams based on the viewer's role
    if (this.isHost) {
      // Host should see all teams except their own
      const visibleTeams = this.teams.filter(team => team.teamId !== hostTeamId);
      console.log('Visible Teams for Host:', visibleTeams);
      return visibleTeams;
    } else {
      // Other teams should see all teams except the host's team
      const visibleTeams = this.teams.filter(team => team.teamId !== hostTeamId);
      console.log('Visible Teams for Other Teams:', visibleTeams);
      return visibleTeams;
    }
  }
}