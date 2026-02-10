import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';

@Injectable({ providedIn: 'root' })
export class PartyService {
  private apiUrl = `${API_BASE}/api/party`;

  constructor(private http: HttpClient) {}

  createParty(hostName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, { hostName });
  }

  joinParty(partyCode: string, playerName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/join`, { partyCode, playerName });
  }

  getPartyDetails(partyCode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${partyCode}`);
  }
  // End game: delete party and all players
  endGame(partyCode: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/end/${partyCode}`);
  }
    // Remove a single player from a party
  removePlayer(partyCode: string, playerName: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${partyCode}/remove-player/${encodeURIComponent(playerName)}`);
  }
}
