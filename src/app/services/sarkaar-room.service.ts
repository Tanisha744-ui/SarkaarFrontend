import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SarkaarRoomService {
  private hubConnection: signalR.HubConnection;
  teams$ = new BehaviorSubject<string[]>([]);
  connectionState$ = new BehaviorSubject<'connecting' | 'connected' | 'error'>('connecting');
  lastError$ = new BehaviorSubject<string | null>(null);

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5046/sarkaarRoomHub') // Adjusted to match backend port
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('TeamsUpdated', (teams: string[]) => {
      this.teams$.next(teams);
    });

    this.hubConnection.onclose((err) => {
      this.connectionState$.next('error');
      this.lastError$.next(err ? err.message : 'Connection closed');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionState$.next('connected');
    });

    this.hubConnection.start()
      .then(() => this.connectionState$.next('connected'))
      .catch(err => {
        this.connectionState$.next('error');
        this.lastError$.next(err.message);
      });
  }

  createRoom(teamName: string): Promise<string> {
    return this.hubConnection.invoke('CreateRoom', teamName);
  }

  joinRoom(code: string, teamName: string): Promise<boolean> {
    return this.hubConnection.invoke('JoinRoom', code, teamName);
  }

  getTeams(code: string): Promise<string[]> {
    return this.hubConnection.invoke('GetTeams', code);
  }
}
