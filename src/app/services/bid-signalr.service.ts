import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class BidSignalRService {
    sendBid(bid: { gameId: number, teamId: number, amount: number }) {
      if (this.hubConnection) {
        this.hubConnection.invoke('SendBid', bid)
          .catch(err => console.error('SignalR sendBid error:', err));
      }
    }
    private hubConnection: signalR.HubConnection | null = null;
    private bidReceivedSubject = new Subject<{ gameId: number, teamId: number, amount: number }>();
    bidReceived$ = this.bidReceivedSubject.asObservable();
    private chatReceivedSource = new Subject<{ sender: string; text: string }>();
    chatReceived$ = this.chatReceivedSource.asObservable();

  constructor(private ngZone: NgZone, private http: HttpClient) {}

  startConnection(gameId: number) {
    if (this.hubConnection) return;
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://triogamebackend.onrender.com/sarkaarRoomHub')
      .withAutomaticReconnect()
      .build();
    this.hubConnection.on('BidReceived', (data: any) => {
      this.ngZone.run(() => {
        this.bidReceivedSubject.next(data);
      });
    });
    this.hubConnection.on('ChatMessageReceived', (message: { sender: string; text: string }) => {
      this.ngZone.run(() => {
        this.chatReceivedSource.next(message);
      });
    });
    this.hubConnection.start()
      .then(() => this.hubConnection!.invoke('JoinGameGroup', gameId.toString()))
      .catch(err => console.error('SignalR connection error:', err));
  }

  stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  sendChatMessage(message: { roomCode: string; sender: string; text: string }) {
    if (this.hubConnection) {
      this.hubConnection.invoke('SendChatMessage', message)
        .catch(err => console.error('SignalR sendChatMessage error:', err));
    }
    this.http.post('/api/chat/send', message).subscribe({
      error: err => console.error('HTTP sendChatMessage error:', err)
    });
  }

  fetchChatMessages(roomCode: string) {
    return this.http.get<{ sender: string; text: string }[]>(`/api/chat/get/${roomCode}`);
  }

  clearChatMessages(roomCode: string) {
    return this.http.delete(`/api/chat/clear/${roomCode}`);
  }
}
