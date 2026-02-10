import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class SignalRService {
      // Reset the game started state (for restarting the game)
      resetGameStarted(partyCode: string): void {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
          this.hubConnection.invoke('ResetGameStarted', partyCode).catch(err => console.error(err));
        }
      }

      // Listen for game restarted event
      onGameRestarted(callback: () => void): void {
        if (this.hubConnection) {
          this.hubConnection.off('ReceiveGameRestarted');
          this.hubConnection.on('ReceiveGameRestarted', callback);
        }
      }
    // Broadcast Full House claimed to all clients in the party
    sendFullHouseClaimed(partyCode: string): void {
      if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
        this.hubConnection.invoke('SendFullHouseClaimed', partyCode).catch(err => console.error(err));
      }
    }

    // Listen for Full House claimed event
    onFullHouseClaimed(callback: () => void): void {
      if (this.hubConnection) {
        this.hubConnection.off('ReceiveFullHouseClaimed');
        this.hubConnection.on('ReceiveFullHouseClaimed', callback);
      }
    }
  // ...existing code...

  // Broadcast restart game to all clients in the party
  sendRestartGame(partyCode: string) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendRestartGame', partyCode).catch((err: any) => console.error(err));
    }
  }

  // Listen for restart game event
  onRestartGame(callback: () => void) {
    if (this.hubConnection) {
      this.hubConnection.off('ReceiveRestartGame');
      this.hubConnection.on('ReceiveRestartGame', callback);
    }
  }
  // Listen for already claimed bonus event
  onbonusCardAlreadyClaimed(callback: (bonusType: string, claimedBy: string) => void): void {
    if (this.hubConnection) {
      this.hubConnection.off('bonusCardAlreadyClaimed');
      this.hubConnection.on('bonusCardAlreadyClaimed', callback);
    }
  }

    // Send bonus card claim event
    claimbonusCard(partyCode: string, bonusType: string, playerName: string): void {
      if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
        this.hubConnection.invoke('ClaimbonusCard', partyCode, bonusType, playerName).catch(err => console.error(err));
      }
    }

    // Listen for bonus card claim events
    onbonusCardClaimed(callback: (bonusType: string, playerName: string) => void): void {
      if (this.hubConnection) {
        this.hubConnection.off('bonusCardClaimed');
        this.hubConnection.on('bonusCardClaimed', callback);
      }
    }
  private hubConnection!: signalR.HubConnection;


  private connectionStarted = false;
  async startConnection(): Promise<void> {
    if (this.connectionStarted) return;
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5046/partyHub')
      .withAutomaticReconnect()
      .build();
    await this.hubConnection.start().then(() => {
      this.connectionStarted = true;
    }).catch(err => console.error('SignalR Connection Error:', err));
  }

  async joinParty(partyCode: string, playerName: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) return;
    this.hubConnection.invoke('JoinParty', partyCode, playerName).catch(err => console.error(err));
  }
    // Leave the SignalR party group and update player list
  async leaveParty(partyCode: string, playerName: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeaveParty', partyCode, playerName).catch(err => console.error(err));
    }
  }

  onPlayerJoined(callback: (playerName: string) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on('PlayerJoined', callback);
    }
  }
   // Broadcast a new called number to the party (host calls this)
  sendCalledNumber(partyCode: string, number: number[]): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendCalledNumbers', partyCode, number).catch(err => console.error(err));
    }
  }

  // Listen for called numbers (players listen to this)
  onCalledNumbers(callback: (numbers: number[]) => void): void {
    if (this.hubConnection) {
      // Remove previous handler to avoid duplicate events
      this.hubConnection.off('ReceiveCalledNumbers');
      this.hubConnection.on('ReceiveCalledNumbers', callback);
    }
  }
   // --- SignalR: Party Lock State ---
   async setPartyLockState(partyCode: string, isLocked: boolean): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SetPartyLockState', partyCode, isLocked).catch(err => console.error(err));
    }
  }

  onPartyJoinRejected(callback: (message: string) => void): void {
    if (this.hubConnection) {
      this.hubConnection.off('PartyJoinRejected');
      this.hubConnection.on('PartyJoinRejected', callback);
    }
  }

  onPartyLockStateChanged(callback: (isLocked: boolean) => void): void {
    if (this.hubConnection) {
      this.hubConnection.off('PartyLockStateChanged');
      this.hubConnection.on('PartyLockStateChanged', callback);
    }
  }
    // Broadcast the full player list to all clients (host calls this after join/leave)
  sendPlayerList(partyCode: string, players: string[]): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendPlayerList', partyCode, players).catch(err => console.error(err));
    }
  }
  

  // Listen for player list updates (all clients listen to this)
  onPlayerListUpdated(callback: (players: string[]) => void): void {
    if (this.hubConnection) {
      this.hubConnection.off('ReceivePlayerList');
      this.hubConnection.on('ReceivePlayerList', callback);
    }
  }
    // Broadcast game started to all players
  sendGameStarted(partyCode: string): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendGameStarted', partyCode).catch(err => console.error(err));
    }
  }

  // Listen for game started event
  onGameStarted(callback: () => void): void {
    if (this.hubConnection) {
      this.hubConnection.off('ReceiveGameStarted');
      this.hubConnection.on('ReceiveGameStarted', callback);
    }
  }
    // Send status update to all clients in the party
  sendStatusUpdate(partyCode: string, status: string) {
    this.hubConnection.invoke('SendStatusUpdate', partyCode, status);
  }

  // Register a handler for status updates
  onStatusUpdate(callback: (status: string) => void) {
    if (this.hubConnection) {
      this.hubConnection.off('ReceiveStatusUpdate');
      this.hubConnection.on('ReceiveStatusUpdate', callback);
    }
  }

  // SignalR: End game for all clients in the party
  sendEndGame(partyCode: string) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendEndGame', partyCode).catch(err => console.error(err));
    }
  }

  // Listen for end game event
  onEndGame(callback: () => void) {
    if (this.hubConnection) {
      this.hubConnection.off('ReceiveEndGame');
      this.hubConnection.on('ReceiveEndGame', callback);
    }
  }
}
