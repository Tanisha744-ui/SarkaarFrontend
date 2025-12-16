import { Component, ViewChild } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { TeamCard } from '../team-card/team-card';
import { Timer } from '../timer/timer';

interface TeamData {
  teamId: string;
  name: string;
  balance: number;
  currentBid?: number;
}

@Component({
  selector: 'app-landingpage',
  imports: [TeamCard, NgFor, NgIf, Timer],
  templateUrl: './landingpage.html',
  styleUrl: './landingpage.css',
  standalone: true
})
export class Landingpage {
  teams: TeamData[] = [];

  constructor() {
    // Try to read team names from localStorage
    const storedNames = localStorage.getItem('teamNames');
    let names: string[] = [];
    try {
      if (storedNames) {
        names = JSON.parse(storedNames);
      }
    } catch {}
    // Use provided names, fallback to default
    if (names.length >= 2 && names.length <= 4) {
      this.teams = names.map((name, idx) => ({
        teamId: String.fromCharCode(65 + idx),
        name,
        balance: 100000,
        currentBid: undefined
      }));
    } else {
      this.teams = [
        { teamId: 'A', name: 'Team A', balance: 100000, currentBid: undefined },
        { teamId: 'B', name: 'Team B', balance: 100000, currentBid: undefined },
        { teamId: 'C', name: 'Team C', balance: 100000, currentBid: undefined },
        { teamId: 'D', name: 'Team D', balance: 100000, currentBid: undefined }
      ];
    }
  }

  isGameLocked: boolean = false;
  activeTeam: string | null = null;
  @ViewChild('roundTimer') roundTimer?: Timer;

  // Checking whether all teams have placed a positive bid and
  // the maximum bid is unique (occurs exactly once)
  canLock(): boolean {
  const bids = this.teams.map(t => t.currentBid);
  // All teams must have entered a bid (including zero)
  if (bids.some(b => b === undefined || b === null)) return false;
  // Find all non-zero bids
  const nonZeroBids = bids.filter(b => typeof b === 'number' && b > 0) as number[];
  if (nonZeroBids.length === 0) return false; // At least one non-zero bid required
  // The maximum non-zero bid must be unique
  const max = Math.max(...nonZeroBids);
  const maxCount = nonZeroBids.filter(b => b === max).length;
  return maxCount === 1;
  }

  onBidPlaced(amount: number, teamId: string) {
    const team = this.teams.find(t => t.teamId === teamId);
    if (!team) return;
    // Zero is always valid
    if (amount === 0) {
      team.currentBid = 0;
      console.log(`Team ${teamId} placed bid: 0. Can lock: ${this.canLock()}`);
      return;
    }
    // For non-zero bids, must be strictly greater than all previous non-zero bids
    const otherBids = this.teams.filter(t => t.teamId !== teamId).map(t => t.currentBid ?? 0);
    const maxOtherBid = Math.max(0, ...otherBids.filter(b => b > 0));
    if (amount <= maxOtherBid) {
      // Reject bid: do not update currentBid
      alert(`Bid must be greater than ₹${maxOtherBid}`);
      return;
    }
    // Accept bid only if valid
    team.currentBid = amount;
    console.log(`Team ${teamId} placed bid: ${amount}. Can lock: ${this.canLock()}`);
  }

  onTimerFinished() {
    // If timer finishes while bids are locked, auto-mark as wrong for active team
    if (this.isGameLocked && this.activeTeam) {
      console.log('Timer expired: auto-marking wrong for', this.activeTeam);
      this.handleAnswer(false, this.activeTeam);
    }
  }

  lockBids() {
    if (!this.canLock() || this.isGameLocked) return;
    // finding team with highest bid
    let max = -Infinity;
    let winner: TeamData | null = null;
    for (const t of this.teams) {
      if ((t.currentBid || 0) > max) {
        max = t.currentBid || 0;
        winner = t;
      }
    }
    if (winner) {
      this.isGameLocked = true;  // shows timer
      this.activeTeam = winner.teamId;
    }
  }

  handleAnswer(correct: boolean, teamId: string) {
    if (this.isProcessingResult) return;
    const team = this.teams.find(t => t.teamId === teamId);
    if (!team) return;
    const bidAmount = team.currentBid || 0;

    this.isProcessingResult = true;

    this._setResultState(teamId, correct ? 'correct' : 'wrong');

    // Wait for animation(yellow or green for incorrect or correct ), then apply balance change and reset UI
    setTimeout(() => {
      if (correct) {
        team.balance += bidAmount;
      } else {
        team.balance -= bidAmount;
      }

      this.teams.forEach(t => t.currentBid = 0);
      this.isGameLocked = false;
      this.activeTeam = null;
      if (this.roundTimer) {
        this.roundTimer.reset();
      }

      this.isProcessingResult = false;
    }, 3000);
  }

  isProcessingResult = false;
  results: Record<string, 'none' | 'correct' | 'wrong'> = {};

  private _setResultState(teamId: string, state: 'correct' | 'wrong'){
    this.results[teamId] = state;
    setTimeout(()=>{
      this.results[teamId] = 'none';
    }, 3000);
  }

}
