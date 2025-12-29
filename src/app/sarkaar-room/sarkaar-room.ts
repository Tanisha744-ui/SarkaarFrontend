
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SarkaarRoomService } from '../services/sarkaar-room.service';

@Component({
  selector: 'app-sarkaar-room',
  standalone: true,
  templateUrl: './sarkaar-room.html',
  styleUrl: './sarkaar-room.css',
  imports: [CommonModule, FormsModule]
})

export class SarkaarRoom {
  mode: 'none' | 'create' | 'join' = 'none';
  teamName = '';
  code = '';
  teams: string[] = [];
  joined = false;
  isCreator = false;
  connectionState: 'connecting' | 'connected' | 'error' = 'connecting';
  lastError: string | null = null;

  constructor(private roomService: SarkaarRoomService, private router: Router) {
    this.roomService.teams$.subscribe(teams => this.teams = teams);
    this.roomService.connectionState$.subscribe(state => this.connectionState = state);
    this.roomService.lastError$.subscribe(err => this.lastError = err);
  }

  selectMode(mode: 'create' | 'join') {
    this.mode = mode;
    this.teamName = '';
    this.code = '';
    this.joined = false;
    this.isCreator = (mode === 'create');
  }

  async createRoom() {
    if (!this.teamName) return;
    if (this.connectionState !== 'connected') {
      alert('Not connected to server. Please wait or try again.');
      return;
    }
    try {
      this.code = await this.roomService.createRoom(this.teamName);
      this.joined = true;
      this.isCreator = true;
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
      const success = await this.roomService.joinRoom(this.code, this.teamName);
      if (success) {
        this.joined = true;
        this.isCreator = false;
      } else {
        alert('Invalid code or room full');
      }
    } catch (err: any) {
      alert('Failed to join room: ' + (err?.message || err));
    }
  }

  proceedToGame() {
    // Save the real-time teams to localStorage for the game page
    localStorage.setItem('teamNames', JSON.stringify(this.teams));
    this.router.navigate(['/game']);
  }
}
