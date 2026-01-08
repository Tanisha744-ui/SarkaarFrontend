import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SarkaarRoomService } from '../services/sarkaar-room.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-sarkaar-room',
  standalone: true,
  templateUrl: './sarkaar-room.html',
  styleUrl: './sarkaar-room.css',
  imports: [CommonModule, FormsModule]
})

export class SarkaarRoom implements OnDestroy {
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

  constructor(private roomService: SarkaarRoomService, private router: Router) {
    this.roomService.teams$.subscribe(teams => this.teams = teams);
    this.roomService.connectionState$.subscribe(state => this.connectionState = state);
    this.roomService.lastError$.subscribe(err => this.lastError = err);

    // Subscribe to gameStarted$ to auto-redirect non-host teams
    if (this.roomService.gameStarted$) {
      this.gameStartedSub = this.roomService.gameStarted$.subscribe(started => {
        if (started && this.joined && !this.isLead) {
          this.router.navigate(['/game']);
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
    try {
      // Only pass teamName for now, as service expects one argument
      console.log('Creating room with team name:', this.teamName);
      const result = await this.roomService.createRoomWithTeamCode(this.teamName);
      this.code = result.roomCode;
      this.teamCode = result.teamCode;
      // Store in backend DB
      await this.roomService.storeTeam(this.teamName, this.code).toPromise();
      // Store controls in backend DB
      await this.roomService.storeGameControls(this.code, this.bidInterval, this.maxBidAmount).toPromise();
      // Store room code for later use (for end game)
      localStorage.setItem('roomCode', this.code);
      this.joined = true;
      this.isLead = true;
    } catch (err: any) {
      alert('Failed to create room: ' + (err?.message || err));
    }
  }

  async joinRoom() {
    if (!this.code || !this.teamName) return;
    if (this.connectionState !== 'connected') {
      alert('Not connected to server. Please wait or try again.');
      return;
    }
    try {
      const result = await this.roomService.joinRoomWithTeamCode(this.code, this.teamName) as { success: boolean; teamCode: string; error?: string };
      if (result.success) {
        // Store in backend DB
        await this.roomService.storeTeam(this.teamName, this.code).toPromise();
        // Store room code for later use (for end game)
        localStorage.setItem('roomCode', this.code);
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
    }
  }

  async proceedToGame() {
    // Notify all clients in the room to start the game
    await this.roomService.notifyGameStarted(this.code);
    // Save the real-time teams to localStorage for the game page
    localStorage.setItem('teamNames', JSON.stringify(this.teams));
    this.router.navigate(['/game']);
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
        // Redirect to game page immediately
        this.router.navigate(['/game']);
      } else {
        alert('Invalid team code or team full');
      }
    } catch (err: any) {
      alert('Failed to join team: ' + (err?.message || err));
    }
  }
}
