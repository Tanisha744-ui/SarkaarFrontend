import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LobbyService } from '../services/LobbyService';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
  | 'result'
  | 'viewer'
  | 'viewer-join'; // <-- Added this

interface ViewerPlayer {
  PlayerId: string;
  Name: string;
  IsImposter: boolean;
  Word: string;
}

@Component({
  selector: 'app-imposter-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imposter-game.html',
  styleUrls: ['./imposter-game.css']
})

export class ImposterGame implements OnInit, OnDestroy, AfterViewChecked {

  // ======================
  // STATE
  // ======================
  step: Step = 'home';
  playerName = '';
  isHost = false;
  lobbyCode = '';
  maxPlayers = 3;
  players: string[] = [];
  word = '';
  isImposter = false;
  showWord = false;
  wordTimer = 10;
  private interval: any;
  wordDuration = 10;
  wordStartTime = 0;
  clues: { [player: string]: string } = {};
  myClue: string = '';
  clueTimer: number = 15;
  private clueInterval: any;
  clueSubmitted = false;
  waitingMessage = '';
  imposterName: string | null = null;
  imposterMessage: string = '';
  isAdmin = false;
  imposterRevealed = false;
  round: number = 1;
  votedFor: string | null = null;
  votingResult: { imposterCaught: boolean, accused: string, imposter: string } | null = null;
  proceedToVotingClicked: boolean = false;
  seeWordAgainVisible = false;
  isViewer = false;
  viewerLobbyCode = '';
  viewerData: {
    players: ViewerPlayer[];
    rounds: any[];
    votes: any[];
    result?: any;
    lobbyCode?: string;
  } | null = null; // Holds all info for the viewer
  currentPlayerId: string = ''; // Add currentPlayerId to state
  viewerState: any = null; // <-- Add this
  viewerClues: { [player: string]: string } = {}; // <-- Add this property

  allVotesIn: boolean = false;
  winningPlayer: any = null; // Replace 'any' with your actual player type if you have one
  votes: { [player: string]: string } = {}; // Add this property to store votes

  @ViewChild('someElement') someElement!: ElementRef; // Example ViewChild
  @ViewChild('viewerResultBanner') viewerResultBanner!: ElementRef;

  private lastResultShown: any = null;

  constructor(private lobbyService: LobbyService, private http: HttpClient, public router: Router) { }

  // ======================
  // INIT
  // ======================
  ngOnInit(): void {

    // Lobby created (HOST)
    this.lobbyService.onLobbyCreated(code => {
      this.lobbyCode = code;
      this.isHost = true;
      this.isAdmin = true; // 🔑 ADMIN SET HERE
      this.players = [this.playerName];
      this.step = 'lobby';

    });

    //  Player joined
    this.lobbyService.onPlayerJoined((name) => {
      if (!this.players.includes(name)) {
        this.players.push(name);
      }
    });

    //  All players joined → auto start
    this.lobbyService.onAllPlayersJoined(players => {
      this.players = players;
      this.step = 'word'; // Ensure all players go to word phase
      this.lobbyService.requestWord(this.lobbyCode);
    });

    //  Word assigned (PRIVATE)
    this.lobbyService.onWordAssigned((data: { word: string; isImposter: boolean; wordStartTime: number }) => {
      this.word = data.word;
      this.isImposter = data.isImposter;
      this.step = 'word';
      this.showWord = true;
      this.startWordTimer();
    });

    //  Mode selected by host
    this.lobbyService.onModeSelected(mode => {
      if (mode === 'offline') {
        this.step = 'offline';
      } else if (mode === 'online') {
        this.step = 'clue-entry';
        this.myClue = '';
        this.clueSubmitted = false;
      }
    });

    //  Imposter revealed (OFFLINE)
    this.lobbyService.onImposterRevealed(name => {
      this.imposterName = name;
      this.imposterRevealed = true;
    });

    this.lobbyService.onAllCluesSubmitted((clues) => {
      this.clues = clues;
      this.step = 'clue-review';
    });

    this.lobbyService.onStartNextRound(() => {
      this.proceedToVotingClicked = false;
      this.waitingMessage = '';
      this.myClue = '';
      this.clueSubmitted = false;
      this.round++;
      this.step = 'clue-entry';
    });

    this.lobbyService.onProceedToVoting(() => {
      this.proceedToVotingClicked = false;
      this.waitingMessage = '';
      this.votedFor = null; // Allow voting again in new round
      this.step = 'voting';
    });

    this.lobbyService.onVotingResult((imposterCaught, accused, imposter) => {
      this.votingResult = { imposterCaught, accused, imposter };
      this.waitingMessage = '';
      this.step = 'result';

      // ✅ ALSO UPDATE VIEWER DATA LOCALLY
      if (this.viewerData) {
        this.viewerData = {
          ...this.viewerData,
          result: {
            imposterCaught,
            accused,
            imposter
          }
        };
      }
    });
    if (this.isViewer) {
      this.step = 'viewer';
    }



    this.lobbyService.onSeeWordAgain(() => {
      this.showWord = true;
      this.wordTimer = 10;
      this.seeWordAgainVisible = false;
      this.startWordTimer();
    });

    // Viewer event: receive all game info

    this.lobbyService.onViewerUpdate((data: any) => {
      console.log('[VIEWER DEBUG] Received data in onViewerUpdate:', data);
      let parsedResult = null;
      if (typeof data.result === 'string' && data.result.includes('|')) {
        // Parse backend result string: "true|accusedName|imposterName"
        const [caughtStr, accused, imposter] = data.result.split('|');
        parsedResult = {
          imposterCaught: caughtStr === 'True' || caughtStr === 'true',
          accused,
          imposter
        };
      } else if (typeof data.result === 'object' && data.result) {
        parsedResult = data.result;
      }
      this.viewerData = {
        players: data.players.map((p: any) => ({
          PlayerId: p.PlayerId ?? p.playerId ?? p.id,
          Name: p.Name ?? p.name ?? '',
          IsImposter: p.IsImposter ?? p.isImposter ?? false,
          Word: p.Word ?? p.word ?? ''
        })),
        rounds: data.rounds.map((r: any) => ({
          ...r,
          clues: r.clues.map((c: any) => ({ ...c })),
          decisions: r.decisions ? r.decisions.map((d: any) => ({ ...d })) : []
        })),
        votes: data.votes.map((v: any) => ({
          ...v,
          VoterId: v.VoterId ?? v.voterId,
          SuspectId: v.SuspectId ?? v.suspectId,
          suspectName: v.suspectName ?? (
            (data.players.find((p: any) =>
              (p.PlayerId ?? p.playerId ?? p.id) === (v.SuspectId ?? v.suspectId)
            )?.Name ?? '')
          )
        })),
        result: parsedResult,
        lobbyCode: data.lobbyCode
      };
      if (!parsedResult) {
        console.warn('[VIEWER DEBUG] No result property found in data for viewer!');
      } else {
        console.log('[VIEWER DEBUG] Parsed result for viewer:', parsedResult);
      }
      this.step = 'viewer';
    });

    this.lobbyService.onViewerClueUpdate((data) => {
      // Update the viewer's clue list in real time
      // For example, push to an array or update the UI
      this.viewerClues[data.player] = data.clue;
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  ngAfterViewChecked(): void {
    // This lifecycle hook is called after the view has been checked.
    // You can use it to perform actions that require the view to be updated.

    // Scroll and highlight when result appears
    if (
      this.viewerData?.result &&
      this.viewerData.result !== this.lastResultShown &&
      this.viewerResultBanner
    ) {
      this.lastResultShown = this.viewerData.result;
      setTimeout(() => {
        this.viewerResultBanner.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.viewerResultBanner.nativeElement.classList.add('highlight-animation');
        setTimeout(() => {
          this.viewerResultBanner.nativeElement.classList.remove('highlight-animation');
        }, 2000); // Remove highlight after 2s
      }, 100);
    }
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

  goViewer(): void {
    this.resetGameState();
    this.step = 'viewer-join';
    this.isViewer = true;
  }

  async joinAsViewer() {
    this.isViewer = true;
    this.step = 'viewer'; // 🔥 REQUIRED

    const data = await this.lobbyService.joinAsViewer(this.viewerLobbyCode);
    if (typeof data !== 'undefined' && data !== null) {
      this.viewerData = data; // 🔥 REQUIRED
    } else {
      this.viewerData = null;
    }
  }

  private resetGameState(): void {
    this.word = '';
    this.wordTimer = 10;
    clearInterval(this.interval);
    this.lobbyCode = '';
    this.players = [];
    this.isHost = false;
    this.isAdmin = false;
    this.imposterName = null;
    this.imposterRevealed = false;
    this.round = 1;
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
    this.seeWordAgainVisible = false;
    this.interval = setInterval(() => {
      this.wordTimer--;
      if (this.wordTimer <= 0) {
        clearInterval(this.interval);
        this.showWord = false;
        this.seeWordAgainVisible = false; // Ensure it's hidden for everyone
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
    this.seeWordAgainVisible = false; // Hide the word if mode is chosen
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
    this.clueSubmitted = true;
    this.waitingMessage = 'Waiting for other players...';
    this.lobbyService.submitClue(this.lobbyCode, this.playerName, this.myClue)
      .then(() => {
      });
  }

  startClueReviewTimer() {
    this.clueTimer = 15;
    clearInterval(this.clueInterval);
    this.clueInterval = setInterval(() => {
      this.clueTimer--;
      if (this.clueTimer <= 0) {
        clearInterval(this.clueInterval);
      }
    }, 1000);
  }

  proceedOrNextRound(action: 'next' | 'vote') {
    if (action === 'vote') {
      this.proceedToVotingClicked = true;
      this.waitingMessage = 'Waiting for other players...';
    }
    this.lobbyService.proceedOrNextRound(
      this.lobbyCode,
      this.playerName,
      action
    );
  }

  voteFor(player: string) {
    this.votedFor = player;
    this.waitingMessage = 'Waiting for other players...';
    this.lobbyService.voteFor(this.lobbyCode, this.playerName, player);
  }

  seeWordAgain() {
    this.seeWordAgainVisible = true;
  }

  getClueText(round: any, player: any): string {
    const clue = round.clues?.find((clue: any) => clue.player === player.name);
    return clue?.text || '—';
  }

  getDecisionAction(round: any, player: any): string {
    const decision = round.decisions?.find((decision: any) => decision.player === player.name);
    return decision?.action || '—';
  }

  getVoteForViewerByRound(player: any, roundNum: number): string {
    // If votes are per round, filter by round; if not, just match by player
    // If your backend does not provide round info in votes, remove the round filter
    const vote = this.viewerData?.votes?.find(
      (v: any) => v.VoterId === player.PlayerId && (v.round === roundNum || v.round == null)
    );
    return vote?.suspectName || '—';
  }

  getClueTextForViewer(round: any, player: ViewerPlayer): string {
    if (!round || !round.clues || !player) return '—';
    // Debug log
    console.log('round.clues:', round.clues, 'player.PlayerId:', player.PlayerId);
    const clue = round.clues.find(
      (c: any) =>
        c.PlayerId === player.PlayerId ||
        c.playerId === player.PlayerId
    );
    return clue?.text ?? clue?.clue ?? '—';
  }

  getDecisionForViewer(round: any, player: any): string {
    return round.decisions?.find((d: any) => d.PlayerId === player.PlayerId)?.action || '—';
  }

  getVoteForViewer(player: ViewerPlayer): string {
    const vote = this.viewerData?.votes.find((v: any) => v.VoterId === player.PlayerId);
    return vote?.suspectName ?? '—';
  }

  getViewerClue(player: any): string {
    if (!this.viewerState?.clues || !player) return '—';
    // Find the clue for this player
    const clueObj = this.viewerState.clues.find(
      (c: any) =>
        c.playerId === player.playerId ||
        c.PlayerId === player.playerId ||
        c.playerId === player.PlayerId ||
        c.PlayerId === player.PlayerId
    );
    return clueObj?.clue || clueObj?.text || '—';
  }

  getViewerVoteSuspectName(player: any): string {
    if (!this.viewerState?.votes || !this.viewerState?.players) return '—';
    const vote = this.viewerState.votes.find((v: any) => v.voterId === player.playerId);
    if (!vote) return '—';
    const suspect = this.viewerState.players.find((p: any) => p.playerId === vote.suspectId);
    return suspect?.name || '—';
  }

  endGame() {
    const lobbyCode = this.viewerData?.lobbyCode;
    if (!lobbyCode) return;
    this.http.post('/api/ImposterGame/cleanup', JSON.stringify(lobbyCode), {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: () => this.router.navigate(['/index']),
      error: () => this.router.navigate(['/index'])
    });
  }
  endGameForPlayers() {
    if (this.lobbyCode) {
      this.http.post('https://triogamebackend.onrender.com/api/ImposterGame/cleanup', JSON.stringify(this.lobbyCode), {
        headers: { 'Content-Type': 'application/json' }
      }).subscribe({
        next: () => {
          this.resetGameState();
          this.step = 'home';
        },
        error: () => {
          this.resetGameState();
          this.step = 'home';
        }
      });
    } else {
      this.resetGameState();
      this.step = 'home';
    }
  }

  goToIndex() {
    this.router.navigate(['/index']);
  }

  // Call this method whenever votes are updated
  checkVotesAndSetResult() {
    // Example logic: update this to match your actual data structure
    const totalPlayers = this.players?.length || 0;
    const votesReceived = this.votes ? Object.keys(this.votes).length : 0;

    this.allVotesIn = (votesReceived === totalPlayers && totalPlayers > 0);

    if (this.allVotesIn) {
      // Set the winning player (imposter) for the result modal
      // Replace this logic with your actual winner calculation
      this.winningPlayer = this.imposterName ? this.imposterName : null;
    }
  }

  // Wherever you update votes, call this.checkVotesAndSetResult()
  // For example, in your vote handler or after receiving new votes from the server
}
