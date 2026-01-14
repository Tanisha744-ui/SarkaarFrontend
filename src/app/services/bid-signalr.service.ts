import { Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

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

  constructor(private ngZone: NgZone) {}

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
    this.hubConnection.start()
      .then(() => this.hubConnection!.invoke('JoinGroup', gameId.toString()))
      .catch(err => console.error('SignalR connection error:', err));
  }

  stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }
}
