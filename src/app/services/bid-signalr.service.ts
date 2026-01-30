import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';

@Injectable({ providedIn: 'root' })
export class BidSignalRService {

  private hubConnection: signalR.HubConnection | null = null;
  private bidReceivedSubject = new Subject<{ gameId: number, teamId: number, amount: number }>();
  bidReceived$ = this.bidReceivedSubject.asObservable();
  private chatReceivedSource = new Subject<{ sender: string; text: string }>();
  chatReceived$ = this.chatReceivedSource.asObservable();

  constructor(private ngZone: NgZone, private http: HttpClient) { }

  startConnection(roomCode: string) {
    if (this.hubConnection) {
    this.hubConnection.invoke('JoinGameGroup', roomCode);
    return;
  }
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://triogamebackend.onrender.com/sarkaarRoomHub')
      .withAutomaticReconnect()
      .build();
    this.hubConnection.on('BidReceived', (data) => {
      console.log('SignalR BidReceived:', data);
      this.ngZone.run(() => {
        this.bidReceivedSubject.next(data);
      });
    });
    this.hubConnection.on('ChatMessageReceived', (message: { sender: string; text: string }) => {
      console.log('SignalR ChatMessageReceived:', message);
      this.ngZone.run(() => {
        this.chatReceivedSource.next(message);
      });
    });
    this.hubConnection.start()
      .then(() => this.hubConnection!.invoke('JoinGameGroup', roomCode))
      .catch(err => console.error('SignalR connection error:', err));
  }

  stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }
  sendBid(bid: { roomCode: string, teamId: number, amount: number }) {
    if (!this.hubConnection) return;
    this.hubConnection.invoke('SendBid', bid.roomCode, bid.teamId, bid.amount)
      .catch(err => console.error('SignalR sendBid error:', err));
  }
  sendChatMessage(message: { roomCode: string; sender: string; text: string }) {
    if (this.hubConnection) {
      this.hubConnection.invoke('SendChatMessage', message.roomCode, message.sender, message.text)
        .catch(err => console.error('SignalR sendChatMessage error:', err));
    }
    this.http.post(`${API_BASE}/api/chat/send`, message).subscribe({
      error: err => console.error('HTTP sendChatMessage error:', err)
    });
  }

  fetchChatMessages(roomCode: string) {
    return this.http.get<{ sender: string; text: string }[]>(`${API_BASE}/api/chat/get/${roomCode}`);
  }

  clearChatMessages(roomCode: string) {
    return this.http.delete(`${API_BASE}/api/chat/clear/${roomCode}`);
  }
  updateTeamBalance(teamId: number, newBalance: number) {
  return this.http.put(
    `${API_BASE}/api/team/update-balance/${teamId}`,
    newBalance
  );
}

}
