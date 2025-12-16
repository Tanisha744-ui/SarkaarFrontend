import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImposterGameService } from '../services/ImposterGameService';
 
@Component({
  selector: 'app-imposter-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imposter-game.html',
  styleUrls: ['./imposter-game.css'],
})
export class ImposterGame implements OnDestroy, OnInit {
 
  step: number = 0;
  playerCount: number = 3;
  currentPlayerIndex: number = 0;
  playerNames: string[] = [];
  tempName: string = '';
  gameId: string = '';
  playerId: string = '';
  name: string = '';
  word: string = '';
  isImposter: boolean = false;
  clue: string = '';
 
  clues: any[] = [];
  myClue = '';
  myVote = '';
  players: any[] = [];
  cluesSubmitted = false;
  votesSubmitted = false;
  result: any = null;
  pollInterval: any;
  clueTurnIndex: number = 0;
  voteTurnIndex: number = 0;
  cluePhaseComplete: boolean = false;
  votePhaseComplete: boolean = false;
 
 
  constructor(private gameService: ImposterGameService) {}
 
 
  ngOnInit() {
    // Do not start polling here. Polling will start after game creation or registration.
  }
 
  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
 
 
  // Step 0: Ask for player count
  setPlayerCount() {
    this.playerNames = [];
    this.currentPlayerIndex = 0;
    this.step = 1;
  }
 
 
  // Step 1: Enter each player name
  addPlayerName() {
    if (this.tempName.trim()) {
      this.playerNames.push(this.tempName.trim());
      this.tempName = '';
      this.currentPlayerIndex++;
    }
  }
 
 
  createGame() {
  this.gameService.createGame(this.playerNames).subscribe(res => {
    this.gameId = res.gameId;
 
    // fetch players created in backend
    this.gameService.getPlayers(this.gameId).subscribe(players => {
      this.players = players;
 
      // set first player
      this.currentPlayerIndex = 0;
      this.playerId = this.players[0].playerId;
 
      this.step = 3; // move to waiting/start screen
    });
  });
}
 
startGame() {
  this.gameService.startGame(this.gameId).subscribe(() => {
 
    // MAKE SURE players exist
    this.gameService.getPlayers(this.gameId).subscribe(players => {
      this.players = players;
 
      this.currentPlayerIndex = 0;
      this.playerId = this.players[0].playerId;
 
      this.getWordAndRole();
      this.step = 4;
 
      this.pollInterval = setInterval(() => {
        this.refreshTurnInfo();
      }, 1000);
    });
  });
}
  getWordAndRole() {
  this.gameService
    .getWord(this.gameId, this.playerId)
    .subscribe(res => {
      this.word = res.word;
      this.isImposter = res.isImposter;
    });
}
 
  // Helper to check if it's this player's turn to give a clue
  isMyClueTurn() {
  if (!this.players || this.players.length === 0) return false;
  return this.players[this.clueTurnIndex]?.playerId === this.playerId;
}
 
 
  // Helper to check if this player is the imposter (after all clues are in)
  revealImposter() {
    if (!this.cluePhaseComplete) return false;
    // Optionally, you can add logic to highlight the imposter after clues
    return this.isImposter;
  }
 
 
submitClue() {
  this.gameService
    .submitClue(this.gameId, this.playerId, this.myClue)
    .subscribe(() => {
 
      this.myClue = '';
 
      // 🔥 refresh turn info
      this.gameService.getTurnInfo(this.gameId).subscribe(turn => {
        this.clueTurnIndex = turn.clueTurnIndex;
        this.cluePhaseComplete = turn.cluePhaseComplete;
 
        // 🔥 ALWAYS refresh players after clue submit
        this.gameService.getPlayers(this.gameId).subscribe(players => {
          this.players = players;
 
          if (this.cluePhaseComplete) {
            this.step = 5; // show all clues
          } else {
            this.switchToCurrentTurnPlayer();
          }
        });
      });
    });
}
 
 
 
  // Call this after registering and after submitting a clue or vote
  refreshPlayersAndClues() {
    this.gameService.getPlayers(this.gameId).subscribe(players => {
      this.players = players;
      this.cluesSubmitted = players.every(p => p.clue);
      this.votesSubmitted = players.every(p => p.hasVoted);
    });
    this.gameService.getClues(this.gameId).subscribe(clues => {
      this.clues = clues;
    });
  }
 
  vote(playerId: string) {
    this.gameService.vote(this.gameId, this.playerId, playerId).subscribe(() => {
      this.myVote = playerId;
      this.refreshPlayersAndClues();
    });
  }
 
refreshTurnInfo() {
  this.gameService.getTurnInfo(this.gameId).subscribe(turn => {
    this.clueTurnIndex = turn.clueTurnIndex;
    this.voteTurnIndex = turn.voteTurnIndex;
    this.cluePhaseComplete = turn.cluePhaseComplete;
    this.votePhaseComplete = turn.votePhaseComplete;
  });
}
 
 
 
switchToCurrentTurnPlayer() {
  // Find the next player who hasn't submitted a clue yet
  const nextIndex = this.clueTurnIndex;
  const nextPlayer = this.players[nextIndex];
  if (!nextPlayer) return;
 
  this.playerId = nextPlayer.playerId;
  // Re-fetch word for the new player
  this.getWordAndRole();
  // Optionally, reset myClue for the new player
  this.myClue = '';
}
 
 
 
 
// Switch device to current vote-turn player
switchToVoteTurnPlayer() {
  const currentPlayer = this.players[this.voteTurnIndex];
  if (!currentPlayer) return;
 
  this.playerId = currentPlayer.playerId;
}
 
 
}
 
 