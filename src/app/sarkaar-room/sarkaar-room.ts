import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SarkaarRoomService } from '../services/sarkaar-room.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';

@Component({
  selector: 'app-sarkaar-room',
  standalone: true,
  templateUrl: './sarkaar-room.html',
  styleUrl: './sarkaar-room.css',
  imports: [CommonModule, FormsModule]
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
  teamCode = '';
  teamCodeInput = '';
  memberName = '';
  teams: string[] = [];
  joined = false;
  isLead = false;
  connectionState: 'connecting' | 'connected' | 'error' = 'connecting';
  lastError: string | null = null;
  // Online mode controls
  maxBidAmount: number = 100;
  bidInterval: number = 10;

  constructor(private roomService: SarkaarRoomService, private router: Router, private http: HttpClient) {
    this.roomService.teams$.subscribe(teams => this.teams = teams);
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
    this.teamCode = '';
    this.teamCodeInput = '';
    this.memberName = '';
    this.joined = false;
    this.isLead = (mode === 'create' || mode === 'join');
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
      this.teamCode = result.teamCode;
      // Store in backend DB
      await this.roomService.storeTeam(this.teamName, this.code).toPromise();
      // Store controls in backend DB (old service call removed)
      await this.storeGameControlsApi(this.code, this.bidInterval, this.maxBidAmount);
      // Store room code for later use (for end game)
      localStorage.setItem('roomCode', this.code);
      localStorage.setItem('isHost', 'true');
      localStorage.setItem('myTeamName', this.teamName);

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
        await this.roomService.storeTeam(this.teamName, this.code).toPromise();
        // Store room code for later use (for end game)
        localStorage.setItem('roomCode', this.code);
        localStorage.removeItem('isHost');
        localStorage.setItem('myTeamName', this.teamName);

        this.joined = true;
        this.isLead = false;
        this.teamCode = result.teamCode;
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
    this.isProceeding = true;
    this.proceedingMessage = 'Starting game...';
    // Notify all clients in the room to start the game
    await this.roomService.notifyGameStarted(this.code);
    // Save the real-time teams to localStorage for the game page
    localStorage.setItem('teamNames', JSON.stringify(this.teams));
    // Simulate a short delay for UX (optional, remove if not needed)
    setTimeout(() => {
      this.isProceeding = false;
      this.proceedingMessage = '';
      this.router.navigate(['/sarkaar-online']);
    }, 800);
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

  async joinTeam() {
    if (!this.teamCodeInput || !this.memberName) return;
    if (this.connectionState !== 'connected') {
      alert('Not connected to server. Please wait or try again.');
      return;
    }
    try {
      const success = await this.roomService.joinTeamAsMember(this.teamCodeInput, this.memberName);
      if (success) {
        this.joined = true;
        this.isLead = false;
        localStorage.removeItem('isHost');
        // Redirect to game page immediately
        this.router.navigate(['/sarkaar-online']);
      } else {
        alert('Invalid team code or team full');
      }
    } catch (err: any) {
      alert('Failed to join team: ' + (err?.message || err));
    }
  }
}
