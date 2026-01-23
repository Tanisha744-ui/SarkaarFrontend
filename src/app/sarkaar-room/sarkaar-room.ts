import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SarkaarRoomService } from '../services/sarkaar-room.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';
import { LoaderComponent } from '../shared/loader/loader.component';

@Component({
  selector: 'app-sarkaar-room',
  standalone: true,
  templateUrl: './sarkaar-room.html',
  styleUrl: './sarkaar-room.css',
  imports: [CommonModule, FormsModule, LoaderComponent]
})

export class SarkaarRoom implements OnDestroy {
  isProceeding: boolean = false;
  proceedingMessage: string = '';
  isLoading: boolean = false;
  loadingMessage: string = '';
  private gameStartedSub: any;
  mode: 'none' | 'create' | 'join' | 'joinTeam' = 'none';
  teamName = '';
  code = '';
  isSpectator = false;
  memberName = '';
  teams: string[] = [];
  joined = false;
  isLead = false;
  connectionState: 'connecting' | 'connected' | 'error' = 'connecting';
  lastError: string | null = null;
  // Online mode controls
  maxBidAmount: number = 100;
  bidInterval: number = 10;
  hostTeam: string = ''; // Added to track the host's team
  nonHostTeams: string[] = []; // Precomputed array for teams excluding the host's team

  constructor(private roomService: SarkaarRoomService, private router: Router, private http: HttpClient) {
    this.roomService.teams$.subscribe(teams => {
      this.teams = teams;
      if (this.isLead && teams.length > 0) {
        this.hostTeam = teams[0]; // Assuming the host's team is the first in the list
      }
      this.nonHostTeams = teams.filter(t => t !== this.hostTeam); // Compute non-host teams
    });
    this.roomService.connectionState$.subscribe(state => this.connectionState = state);
    this.roomService.lastError$.subscribe(err => this.lastError = err);

    // Subscribe to gameStarted$ to auto-redirect non-host teams
    if (this.roomService.gameStarted$) {
      this.gameStartedSub = this.roomService.gameStarted$.subscribe(started => {
        if (started && this.joined && !this.isLead) {
          this.router.navigate(['/sarkaar-online']);
        }
      });
    }
  }
  ngOnDestroy() {
    if (this.gameStartedSub) {
      this.gameStartedSub.unsubscribe();
    }
  }

  selectMode(mode: 'create' | 'join' | 'joinTeam') {
    this.mode = mode;
    this.teamName = '';
    this.code = '';
    this.memberName = '';
    this.joined = false;
    this.isLead = (mode === 'create' || mode === 'join');
    this.isSpectator = (mode == 'joinTeam');
  }

  async createRoom() {
    if (!this.teamName) return;
    if (this.connectionState !== 'connected') {
      alert('Not connected to server. Please wait or try again.');
      return;
    }
    this.isLoading = true;
    this.loadingMessage = 'Creating room...';
    try {
      // Only pass teamName for now, as service expects one argument
      console.log('Creating room with team name:', this.teamName);
      const result = await this.roomService.createRoomWithTeamCode(this.teamName);
      this.code = result.roomCode;
      // Store in backend DB
      await this.roomService.storeTeam(this.teamName, this.code, this.maxBidAmount).toPromise(); // Pass initial balance
      // Store controls in backend DB (old service call removed)
      await this.storeGameControlsApi(this.code, this.bidInterval, this.maxBidAmount);
      // Store room code for later use (for end game)
      sessionStorage.setItem('roomCode', this.code);
      sessionStorage.setItem('isHost', 'true');
      sessionStorage.setItem('myTeamName', this.teamName);

      this.joined = true;
      this.isLead = true;
    } catch (err: any) {
      alert('Failed to create room: ' + (err?.message || err));
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }

  async joinRoom() {
    if (!this.code || !this.teamName) return;
    if (this.connectionState !== 'connected') {
      alert('Not connected to server. Please wait or try again.');
      return;
    }
    this.isLoading = true;
    this.loadingMessage = 'Joining room...';
    try {
      const result = await this.roomService.joinRoomWithTeamCode(this.code, this.teamName) as { success: boolean; teamCode: string; error?: string };
      if (result.success) {
        // Store in backend DB
        await this.roomService.storeTeam(this.teamName, this.code, this.maxBidAmount).toPromise(); // Pass initial balance
        // Store room code for later use (for end game)
        sessionStorage.setItem('roomCode', this.code);
        sessionStorage.removeItem('isHost');
        sessionStorage.setItem('myTeamName', this.teamName);

        this.joined = true;
        this.isLead = false;
      } else {
        // Show specific error if provided
        if (result.error === 'Game already started') {
          alert('Cannot join: The game has already started.');
        } else if (result.error) {
          alert(result.error);
        } else {
          alert('Invalid code or room full');
        }
      }
    } catch (err: any) {
      alert('Failed to join room: ' + (err?.message || err));
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }

  async proceedToGame() {
    console.log('Proceeding to game for room code:', this.code);
    this.isProceeding = true;
    this.proceedingMessage = 'Starting game...';
    // Notify all clients in the room to start the game
    if (this.connectionState !== 'connected') {
      console.error('SignalR connection is not established.');
      this.isProceeding = false;
      this.proceedingMessage = '';
      return;
    }
    try {
      console.log('Notifying game started for room code:', this.code);
      await this.roomService.setGameStarted(this.code, true);
      console.log('Game started notification sent successfully.');
      localStorage.setItem('teamNames', JSON.stringify(this.teams));

      setTimeout(() => {
        console.log('Stored team names in localStorage:', this.teams);
        console.log('Navigating to /sarkaar-online');
        this.isProceeding = false;
        this.proceedingMessage = '';
        this.router.navigate(['/sarkaar-online']);
      }, 800)
    } catch (err) {
      console.error('Error in proceeding the game:', err);
      this.isProceeding = false;
      this.proceedingMessage = '';
    }
  }
  /**
   * Store game controls in backend using GameControls API
   */
  async storeGameControlsApi(gameCode: string, interval: number, maxBidAmount: number) {
    const controls = {
      gameCode,
      interval,
      maxBidAmount
    };
    try {
      await this.http.post(`${API_BASE}/api/GameControls`, controls).toPromise();
    } catch (err) {
      console.error('Failed to store game controls:', err);
    }
  }

  async joinAsSpectator() {
    await this.roomService.joinRoomAsSpectator(this.code, this.memberName);

    sessionStorage.setItem('roomCode', this.code);
    sessionStorage.setItem('isSpectator', 'true');

    this.router.navigate(['/sarkaar-online']);
  }

  
  async updateTeamBalance(teamName: string, bidAmount: number, isCorrect: boolean) {
    if (this.connectionState !== 'connected') {
      alert('Not connected to server. Please wait or try again.');
      return;
    }

    const updatePayload = {
      teamName,
      bidAmount,
      isCorrect
    };

    try {
      this.isLoading = true;
      this.loadingMessage = 'Updating team balance...';
      const updatedBalance = await this.http.post<number>(`${API_BASE}/api/UpdateTeamBalance`, updatePayload).toPromise();
      console.log(`Balance updated for team: ${teamName}, new balance: ${updatedBalance}`);

      // Update the frontend state with the new balance
      const teamIndex = this.teams.findIndex(team => team === teamName);
      if (teamIndex !== -1) {
        this.teams[teamIndex] = `${teamName} (Balance: ${updatedBalance})`;
      }
    } catch (err) {
      console.error('Failed to update team balance:', err);
      alert('Failed to update team balance. Please try again.');
    } finally {
      this.isLoading = false;
      this.loadingMessage = '';
    }
  }

}
