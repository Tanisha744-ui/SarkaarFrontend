import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ImposterGameService {
          getTurnInfo(gameId: string) {
            return this.http.get<any>(`${this.api}/turn-info?gameId=${gameId}`);
          }
        getPlayers(gameId: string) {
          return this.http.get<any[]>(`${this.api}/players?gameId=${gameId}`);
        }
      getClues(gameId: string) {
        return this.http.get<any[]>(`${this.api}/clues?gameId=${gameId}`);
      }

      getResult(gameId: string) {
        return this.http.get<any>(`${this.api}/result?gameId=${gameId}`);
      }
    // registerPlayer(gameId: string, name: string) {
    //   return this.http.post<any>(`${this.api}/register-player`, { gameId, name });
    // }
  api = 'http://localhost:5046/api/ImposterGame';
  gameId: string = '';

  players: any[] = [];
  clues: any[] = [];
  cluesSubmitted: boolean = false;
  votesSubmitted: boolean = false;

  constructor(private http: HttpClient) {}

  createGame(playerNames: string[]) {
    return this.http.post<any>(`${this.api}/create`, { playerNames });
  }

  joinGame(gameId: string, name: string) {
    return this.http.post<any>(`${this.api}/join`, { gameId, name });
  }

  startGame(gameId: string) {
    return this.http.post(`${this.api}/start?gameId=${gameId}`, {});
  }

  getWord(gameId: string, playerId: string) {
    return this.http.get<any>(`${this.api}/word?gameId=${gameId}&playerId=${playerId}`);
  }

  submitClue(gameId: string, playerId: string, clue: string) {
    return this.http.post(`${this.api}/submit-clue`, { gameId, playerId, clue });
  }

  vote(gameId: string, playerId: string, suspectId: string) {
    // Backend expects: GameId, VoterId, SuspectId
    return this.http.post(`${this.api}/vote`, {
      GameId: gameId,
      VoterId: playerId,
      SuspectId: suspectId
    });
  }

  refreshPlayersAndClues() {
    if (!this.gameId || this.gameId.length < 10) return; // Only fetch if gameId is set and looks like a GUID
    this.getPlayers(this.gameId).subscribe(players => {
      this.players = players;
      this.cluesSubmitted = players.every(p => p.clue);
      this.votesSubmitted = players.every(p => p.hasVoted);
    });
    this.getClues(this.gameId).subscribe(clues => {
      this.clues = clues;
    });
  }
}