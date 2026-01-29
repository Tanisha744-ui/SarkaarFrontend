import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';

@Injectable({ providedIn: 'root' })
export class SarkaarRoomService {
  private hubConnection: signalR.HubConnection;
  teams$ = new BehaviorSubject<string[]>([]);
  connectionState$ = new BehaviorSubject<'connecting' | 'connected' | 'error'>('connecting');
  lastError$ = new BehaviorSubject<string | null>(null);
  gameStarted$ = new BehaviorSubject<boolean>(false);

  // Store game controls in backend DB
  storeGameControls(gameCode: string, interval: number, maxBidAmount: number) {
    return this.http.post(`${API_BASE}/api/GameControls`, {
      gameCode,
      interval,
      maxBidAmount
    });
  }

  constructor(private http: HttpClient) {
    // Store team in backend DB
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://triogamebackend.onrender.com/sarkaarRoomHub') // Adjusted to match backend port
      .withAutomaticReconnect()
      .build();


    this.hubConnection.on('TeamsUpdated', (teams: string[]) => {
      this.teams$.next(teams);
    });

    this.hubConnection.on('GameStartedChanged', (started: boolean) => {
      this.gameStarted$.next(started);
    });

    // Listen for the real-time GameStarted event from backend
    this.hubConnection.on('GameStarted', () => {
      console.log('GameStarted event received from backend');
      this.gameStarted$.next(true);
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

  // Store team in backend DB
  storeTeam(teamName: string, gameCode: string, balance: number) {
    const payload = { name: teamName, gameCode, balance };
    console.log('Payload being sent to /api/Team/create:', payload);
    return this.http.post(`${API_BASE}/api/Team/create`, payload);
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

  joinTeam(code: string, teamName: string): Promise<boolean> {
    return this.hubConnection.invoke('JoinTeam', code, teamName);
  }
  getGameControls(gameCode: string) {
    return this.http.get(`${API_BASE}/api/GameControls/${gameCode}`);
  }

  // Game started logic
  async setGameStarted(roomCode: string, started: boolean): Promise<void> {
    await this.hubConnection.invoke('SetGameStarted', roomCode, started);
    this.gameStarted$.next(started);
  }

  async checkGameStarted(roomCode: string): Promise<boolean> {
    const started = await this.hubConnection.invoke('CheckGameStarted', roomCode);
    this.gameStarted$.next(started);
    return started;
  }

  async checkGameStartedByTeamCode(teamCode: string): Promise<boolean> {
    const started = await this.hubConnection.invoke('CheckGameStartedByTeamCode', teamCode);
    this.gameStarted$.next(started);
    return started;
  }

  // New methods for unique team code logic
  createRoomWithTeamCode(teamName: string): Promise<{ roomCode: string, teamCode: string }> {
    // Assumes backend returns both roomCode and teamCode
    return this.hubConnection.invoke('CreateRoomWithTeamCode', teamName);
  }
  joinRoomWithTeamCode(roomCode: string, teamName: string): Promise<{ success: boolean, teamCode: string }> {
    // Assumes backend returns success and teamCode for the lead
    return this.hubConnection.invoke('JoinRoomWithTeamCode', roomCode, teamName);
  }

  joinTeamAsMember(teamCode: string, memberName: string): Promise<boolean> {

    // Assumes backend allows team members to join using teamCode
    return this.hubConnection.invoke('JoinTeamAsMember', teamCode, memberName);
  }

  // Call this to notify all clients in the room to start the game
  notifyGameStarted(roomCode: string): Promise<void> {
    console.log('Invoking StartGame for room code:', roomCode);
    return this.hubConnection.invoke('StartGame', roomCode).then(()=>console.log('StartGame invoked successfully'))
    .catch(err=>{
      console.error('Error invoking StartGame:', err);
    })
  }

  joinRoomAsSpectator(roomCode: string, viewerName: string): Promise<void> {
    return this.hubConnection.invoke('JoinRoomAsSpectator', roomCode, viewerName);
  }

}
