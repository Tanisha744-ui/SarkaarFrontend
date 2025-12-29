import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LobbyService {

  private connection!: signalR.HubConnection;
  private connectionStarted: Promise<void>;

  // ======================
  // SUBJECTS (INTERNAL)
  // ======================
  private lobbyCreated$ = new Subject<string>();
  private playerJoined$ = new Subject<string>();
  private allPlayersJoined$ = new Subject<string[]>();
  // private wordAssigned$ = new Subject<{ word: string; isImposter: boolean }>();
  private modeSelected$ = new Subject<'online' | 'offline'>();
  private imposterRevealed$ = new Subject<string>();
  private allCluesSubmitted$ = new Subject<{ [player: string]: string }>();

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5046/lobbyhub')
      .withAutomaticReconnect()
      .build();

    this.registerHandlers();
    this.connectionStarted = this.connection.start();
  }

  // ======================
  // SIGNALR HANDLERS
  // ======================
  private registerHandlers(): void {

    this.connection.on('LobbyCreated', (code: string) => {
      this.lobbyCreated$.next(code);
    });

    this.connection.on('PlayerJoined', (name: string) => {
      this.playerJoined$.next(name);
    });

    this.connection.on('AllPlayersJoined', (players: string[]) => {
      this.allPlayersJoined$.next(players);
    });

    // this.connection.on('WordAssigned', (word: string, isImposter: boolean) => {
    //   this.wordAssigned$.next({ word, isImposter });
    // });

    this.connection.on('ModeSelected', (mode: 'online' | 'offline') => {
      this.modeSelected$.next(mode);
    });

    this.connection.on('ImposterRevealed', (name: string) => {
      this.imposterRevealed$.next(name);
    });
  }

  // ======================
  // CALLBACK APIS (PUBLIC)
  // ======================

  onLobbyCreated(cb: (code: string) => void) {
    this.lobbyCreated$.subscribe(cb);
  }

  onPlayerJoined(cb: (name: string) => void) {
    this.playerJoined$.subscribe(cb);
  }

  onAllPlayersJoined(cb: (players: string[]) => void) {
    this.allPlayersJoined$.subscribe(cb);
  }

  onWordAssigned(callback: (data: { word: string; isImposter: boolean; wordStartTime: number }) => void) {
    this.connection.on('WordAssigned', callback);
  }


  onModeSelected(cb: (mode: 'online' | 'offline') => void) {
    this.modeSelected$.subscribe(cb);
  }

  revealImposter(lobbyCode: string) {
    this.connection.invoke('RevealImposter', lobbyCode);
  }

  onImposterRevealed(cb: (name: string) => void) {
    this.connection.on('ImposterRevealed', cb);
  }

  onAllCluesSubmitted(cb: (clues: { [player: string]: string }) => void) {
    this.connection.on('AllCluesSubmitted', cb);
  }

  onStartNextRound(cb: () => void) {
    this.connection.on('StartNextRound', cb);
  }

  onProceedToVoting(cb: () => void) {
    this.connection.on('ProceedToVoting', cb);
  }

  onVotingResult(cb: (imposterCaught: boolean, accused: string, imposter: string) => void) {
    this.connection.on('VotingResult', cb);
  }


  // ======================
  // CLIENT → SERVER
  // ======================

  async createLobby(playerName: string, maxPlayers: number) {
    await this.connectionStarted;
    this.connection.invoke('CreateLobby', playerName, maxPlayers);
  }

  async joinLobby(code: string, name: string) {
    await this.connectionStarted;
    this.connection.invoke('JoinLobby', code, name);
  }

  async requestWord(code: string) {
    await this.connectionStarted;
    this.connection.invoke('RequestWord', code);
  }

  async selectMode(code: string, mode: 'online' | 'offline') {
    await this.connectionStarted;
    this.connection.invoke('SelectMode', code, mode);
  }

  async submitClue(code: string, player: string, clue: string) {
    await this.connectionStarted;
    this.connection.invoke('SubmitClue', code, player, clue);
  }

  async proceedOrNextRound(code: string, player: string, action: 'next' | 'vote') {
    await this.connectionStarted;
    this.connection.invoke('ProceedOrNextRound', code, player, action);
  }

  async voteFor(code: string, voter: string, votedPlayer: string) {
    await this.connectionStarted;
    this.connection.invoke('VoteFor', code, voter, votedPlayer);
  }
}
