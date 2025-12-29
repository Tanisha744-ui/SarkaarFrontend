import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LobbyService } from '../services/LobbyService';

type Step =
  | 'home'
  | 'create'
  | 'join'
  | 'lobby'
  | 'word'
  | 'mode'
  | 'offline'
  | 'clue-entry'
  | 'clue-review'
  | 'voting'
  | 'result';

@Component({
  selector: 'app-imposter-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imposter-game.html',
  styleUrls: ['./imposter-game.css']
})
export class ImposterGame implements OnInit, OnDestroy {

  // ======================
  // STATE
  // ======================
  step: Step = 'home';

  // Player
  playerName = '';
  isHost = false;

  // Lobby
  lobbyCode = '';
  maxPlayers = 3;
  players: string[] = [];

  // Word
  word = '';
  isImposter = false;
  showWord = false;
  wordTimer = 10;
  private interval: any;
  wordDuration = 10; // seconds
  wordStartTime = 0;

  // Clue
  clues: { [player: string]: string } = {};
  myClue: string = '';
  clueTimer: number = 15;
  private clueInterval: any;

  // Result
  imposterName: string | null = null;
  imposterMessage: string = ''; // Add this property to your component
  isAdmin = false; // set this based on lobby creator
  imposterRevealed = false;

  round: number = 1;
  proceedVotes: { [player: string]: 'next' | 'vote' } = {};

  votedFor: string | null = null;
  votes: { [player: string]: string } = {};

  votingResult: { imposterCaught: boolean, accused: string, imposter: string } | null = null;

  constructor(private lobbyService: LobbyService) { }

  // ======================
  // INIT
  // ======================
  ngOnInit(): void {

    // 🔔 Lobby created (HOST)
    this.lobbyService.onLobbyCreated(code => {
      this.lobbyCode = code;
      this.isHost = true;
      this.isAdmin = true; // 🔑 ADMIN SET HERE
      this.players = [this.playerName];
      this.step = 'lobby';

    });

    // 🔔 Player joined
    this.lobbyService.onPlayerJoined((name) => {
      if (!this.players.includes(name)) {
        this.players.push(name);
      }
    });

    // 🔔 All players joined → auto start
    this.lobbyService.onAllPlayersJoined(players => {
      this.players = players;
      this.step = 'word'; // Ensure all players go to word phase
      this.lobbyService.requestWord(this.lobbyCode);
    });

    // 🔔 Word assigned (PRIVATE)
    this.lobbyService.onWordAssigned((data: { word: string; isImposter: boolean; wordStartTime: number }) => {
      this.word = data.word;
      this.isImposter = data.isImposter;
      this.step = 'word';
      this.showWord = true;
      this.startWordTimer();
    });




    // 🔔 Mode selected by host
    this.lobbyService.onModeSelected(mode => {
      if (mode === 'offline') {
        this.step = 'offline';
      } else if (mode === 'online') {
        this.step = 'clue-entry';
        this.myClue = '';
      }
    });

    // 🔔 Imposter revealed (OFFLINE)
    this.lobbyService.onImposterRevealed(name => {
      this.imposterName = name;
      this.imposterRevealed = true; // 🔥 THIS WAS MISSING
    });

    this.lobbyService.onAllCluesSubmitted((clues) => {
      this.clues = clues;
      this.step = 'clue-review';
      this.startClueReviewTimer();
    });

    this.lobbyService.onStartNextRound(() => {
      this.round++;
      this.myClue = '';
      this.clues = {};
      this.step = 'clue-entry';
      this.proceedVotes = {};
    });

    this.lobbyService.onProceedToVoting(() => {
      this.step = 'voting'; // You need to implement the voting UI/logic
      this.proceedVotes = {};
    });

    this.lobbyService.onVotingResult((imposterCaught, accused, imposter) => {
      this.votingResult = { imposterCaught, accused, imposter };
      this.step = 'result';
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  // ======================
  // HOME
  // ======================
  goCreate(): void {
    this.resetGameState();
    this.step = 'create';
  }

  goJoin(): void {
    this.resetGameState();
    this.step = 'join';
  }
  copyCode(): void {
    navigator.clipboard.writeText(this.lobbyCode);
  }

  private resetGameState(): void {
    this.word = '';
    // this.showWord = false;

    this.wordTimer = 10;
    clearInterval(this.interval);

    this.lobbyCode = '';
    this.players = [];
    this.isHost = false;
    this.isAdmin = false;

    this.imposterName = null;
    this.imposterRevealed = false;
  }


  // ======================
  // CREATE / JOIN
  // ======================
  async createLobby(): Promise<void> {
    if (!this.playerName || this.maxPlayers < 3) return;
    await this.lobbyService.createLobby(this.playerName, this.maxPlayers);
  }

  joinLobby(): void {
    if (!this.playerName || !this.lobbyCode) return;

    this.isAdmin = false;
    this.isHost = false;

    this.lobbyService.joinLobby(this.lobbyCode, this.playerName);
    this.step = 'lobby';
  }


  // ======================
  // WORD PHASE
  // ======================
  startWordPhase(): void {
    this.step = 'word';
    this.lobbyService.requestWord(this.lobbyCode);
  }

  private startWordTimer(): void {
    clearInterval(this.interval);

    this.showWord = true;
    this.wordTimer = 10;

    this.interval = setInterval(() => {
      this.wordTimer--;

      if (this.wordTimer <= 0) {
        clearInterval(this.interval);
        this.showWord = false;

        if (this.isHost) {
          this.step = 'mode';
        }
      }
    }, 1000);
  }

  // ======================
  // MODE
  // ======================
  chooseMode(mode: 'online' | 'offline'): void {
    this.lobbyService.selectMode(this.lobbyCode, mode);
  }

  // ======================
  // OFFLINE RESULT
  // ======================
  getImposterName(): string {
    return this.imposterName ?? 'Hidden';
  }
  revealImposter() {
    this.lobbyService.revealImposter(this.lobbyCode);
    // this.imposterRevealed = true;
  }
  startGameIfReady(): string {
    return '';
  }

  private resetWordState(): void {
    this.word = '';
    this.showWord = false;
    this.wordTimer = 10;
  }

  // ======================
  // SYNC WORD TIMER
  // ======================
  private syncWordTimer(): void {
    clearInterval(this.interval);

    const now = Math.floor(Date.now() / 1000);

    if (!this.wordStartTime || isNaN(this.wordStartTime)) {
      // 🛡 SAFETY FALLBACK
      this.wordStartTime = now;
    }

    const elapsed = now - this.wordStartTime;
    const remaining = Math.max(this.wordDuration - elapsed, 0);

    this.wordTimer = remaining;
    this.showWord = remaining > 0;

    this.interval = setInterval(() => {
      this.wordTimer--;

      if (this.wordTimer <= 0) {
        clearInterval(this.interval);
        this.wordTimer = 0;
        this.showWord = false;

        if (this.isHost) {
          this.step = 'mode';
        }
      }
    }, 1000);
  }

  submitClue() {
    if (this.myClue.trim()) {
      this.lobbyService.submitClue(this.lobbyCode, this.playerName, this.myClue.trim());
      // Mark as submitted
      this.clues[this.playerName] = this.myClue.trim();
    }
  }

  startClueReviewTimer() {
    this.clueTimer = 15;
    clearInterval(this.clueInterval);
    this.clueInterval = setInterval(() => {
      this.clueTimer--;
      if (this.clueTimer <= 0) {
        clearInterval(this.clueInterval);
        // Proceed to next phase if needed
      }
    }, 1000);
  }

  proceedOrNextRound(action: 'next' | 'vote') {
    this.proceedVotes[this.playerName] = action;
    this.lobbyService.proceedOrNextRound(this.lobbyCode, this.playerName, action);
  }

  voteFor(player: string) {
    this.votedFor = player;
    this.lobbyService.voteFor(this.lobbyCode, this.playerName, player);
  }
}
