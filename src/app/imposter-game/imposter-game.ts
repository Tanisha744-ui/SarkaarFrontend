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
  resultPollInterval: any = null;
  pollInterval: any = null;

  voteTurnIndex: number = 0;
  clueTurnIndex: number = 0; // Added to fix property error
  cluePhaseComplete: boolean = false; // Added to fix property error
  votePhaseComplete: boolean = false; // Added to fix property error
  nextPlayerIndex: number = 0; // Added to fix property error
  showPassScreen: boolean = false; // Added to fix property error

  constructor(private gameService: ImposterGameService) { }

  ngOnInit() {
    // Do not start polling here. Polling will start after game creation or registration.
  }

  ngOnDestroy() {
    if (this.resultPollInterval) {
      clearInterval(this.resultPollInterval);
      this.resultPollInterval = null;
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

          this.gameService.getPlayers(this.gameId).subscribe(players => {
            this.players = players;

            if (this.cluePhaseComplete) {
              this.step = 5; // show all clues page
              this.refreshPlayersAndClues();
            } else {
              // Show pass screen before next clue
              this.nextPlayerIndex = this.clueTurnIndex;
              this.showPassScreen = true;
              this.step = 4.5;
            }

          });
        });
      });
  }

  // Called when user clicks to proceed from all clues page to voting
  proceedToVotingPhase() {
    this.step = 6; // voting phase
    this.refreshPlayersAndClues();
    this.refreshTurnInfo();
  }
  //         });
  //       });
  //     });
  // }

  proceedToNextClue() {
    // Set playerId to next player and go to clue phase
    const nextPlayer = this.players[this.nextPlayerIndex];
    if (nextPlayer) {
      this.playerId = nextPlayer.playerId;
      this.getWordAndRole();
    }
    this.showPassScreen = false;
    this.step = 4;
  }



  // Call this after registering and after submitting a clue or vote
  refreshPlayersAndClues() {
    this.gameService.getPlayers(this.gameId).subscribe(players => {
      this.players = players;
      this.cluesSubmitted = players.every(p => p.clue);
      this.votesSubmitted = players.every(p => p.hasVoted);

      // Advance voting phase if all have voted
      if (this.step === 5 && this.votesSubmitted) {
        this.pollForResult();
      }
    });
    this.gameService.getClues(this.gameId).subscribe(clues => {
      this.clues = clues;
    });
  }

  // Voting logic: only current voter can vote, then advance turn
  vote(suspectId: string) {
    if (this.players[this.voteTurnIndex]?.playerId !== this.playerId) {
      return;
    }

    this.gameService.vote(this.gameId, this.playerId, suspectId)
      .subscribe({
        next: () => {
          this.myVote = suspectId;

          // 🔥 Always refresh backend state
          this.refreshTurnInfo();

          // 🔥 Show pass device screen
          this.showPassScreen = true;
          this.step = 6.5;
        },
        error: () => {
          // Even if already voted, sync state
          this.refreshTurnInfo();
        }
      });
  }

  proceedToNextVote() {
    const nextPlayer = this.players[this.voteTurnIndex];
    if (!nextPlayer) return;

    this.playerId = nextPlayer.playerId;
    this.showPassScreen = false;
    this.step = 6;
  }
  loadResult() {
    this.gameService.getResult(this.gameId).subscribe(res => {
      this.result = {
        ...res,
        imposterCaught: res.isImposterCaught
      };

      this.showPassScreen = false;   // ✅ ADD THIS
      this.step = 7;
    });
  }




  // Switch device to current vote-turn player
  switchToVoteTurnPlayer() {
    const currentPlayer = this.players[this.voteTurnIndex];
    if (!currentPlayer) return;
    this.playerId = currentPlayer.playerId;
  }

  // Poll for result after voting is complete
  pollForResult() {
    if (this.resultPollInterval) return;
    this.resultPollInterval = setInterval(() => {
      this.gameService.getResult(this.gameId).subscribe(res => {
        if (res && res.finished) {
          this.result = res;
          this.step = 6;
          clearInterval(this.resultPollInterval);
          this.resultPollInterval = null;
        }
      });
    }, 2000);
  }

  refreshTurnInfo() {
    this.gameService.getTurnInfo(this.gameId).subscribe(turn => {
      this.voteTurnIndex = turn.voteTurnIndex;
      this.votePhaseComplete = turn.votePhaseComplete;

      // ✅ If voting finished → show result
      if (this.votePhaseComplete) {
        this.gameService.getResult(this.gameId).subscribe(result => {
          this.result = {
            ...result,
            imposterCaught: result.isImposterCaught
          };

          this.showPassScreen = false;   // ✅ ADD THIS
          this.step = 7;
        });
      }

    });
  }

  switchToCurrentTurnPlayer() {
    // Find the next player who hasn't submitted a clue yet
    const nextIndex = this.clueTurnIndex;
    const nextPlayer = this.players[nextIndex];
    if (!nextPlayer) return undefined;

    this.playerId = nextPlayer.playerId;
    // Re-fetch word for the new player
    this.getWordAndRole();
    // Optionally, reset myClue for the new player
    this.myClue = '';
  }

  getImposterName(): string {
    if (!this.result || !this.result.imposterId || !this.players) { return 'Unknown'; }
    const imposter = this.players.find(p => p.playerId === this.result.imposterId);
    if (imposter && imposter.name) {
      return imposter.name;
    }
    return 'Unknown';
  }


}
