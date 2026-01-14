import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';

export interface BidDto {
  id: number;
  teamId: number;
  amount: number;
  isActive: boolean;
  gameId?: number;
  createdAt: string;
}

export interface CreateBidDto {
  teamId: number;
  amount: number;
  gameId?: number;
}

@Injectable({ providedIn: 'root' })
export class BidService {
  private apiUrl = `${API_BASE}/api/Bid`;

  constructor(private http: HttpClient) {}

  getBids(): Observable<BidDto[]> {
    return this.http.get<BidDto[]>(this.apiUrl);
  }

  createBid(dto: CreateBidDto): Observable<BidDto> {
    return this.http.post<BidDto>(this.apiUrl, dto);
  }

  getBid(id: number): Observable<BidDto> {
    return this.http.get<BidDto>(`${this.apiUrl}/${id}`);
  }

  // Add updateBid if needed in the future
}
