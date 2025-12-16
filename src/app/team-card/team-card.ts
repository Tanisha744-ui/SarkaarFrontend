import { NgClass, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface TeamData {
  teamId: string;
  name: string;
  balance: number;
  currentBid?: number;
}

@Component({
  selector: 'app-team-card',
  imports: [NgClass, NgIf, FormsModule],
  templateUrl: './team-card.html',
  styleUrl: './team-card.css',
  standalone: true
})
export class TeamCard implements OnChanges {
  @Input() team!: TeamData;
  @Input() isLocked: boolean = false;
  @Input() isActive: boolean = false;
  
@Input() highestBid: number = 0; // NEW: track highest bid
  @Input() answerEnabled: boolean = false;
  @Input() resultState: 'none' | 'correct' | 'wrong' = 'none';

  @Output() bidChange = new EventEmitter<number>();
  @Output() answer = new EventEmitter<boolean>();

  currentBidAmount: number | undefined;
  
  // Helper method to safely check if bid exceeds balance
  isBidExceedingBalance(): boolean {
    return this.currentBidAmount !== undefined && this.currentBidAmount > this.team.balance;
  }

  ngOnInit() {
    // Don't set initial value, let placeholder show
    this.currentBidAmount = undefined;
  }

  ngOnChanges(changes: SimpleChanges) {
    // Keep local input value in sync when parent updates team.currentBid (e.g., reset to 0)
    if (changes['team'] && this.team) {
      this.currentBidAmount = this.team.currentBid ?? 0;
    }
    // When locked/unlocked, ensure input reflects current team.bid
    if (changes['isLocked'] && this.team) {
      this.currentBidAmount = this.team.currentBid ?? 0;
    }
  }


  // Only update local value on input change
  onBidChange(amount: number) {
    this.currentBidAmount = amount;
  }

  // Validate and emit bid only on button click
  onBidSubmit(amount: number) {
    if (amount === undefined || amount === null || isNaN(amount)) {
      this.bidChange.emit(0);
      return;
    }
    // Clamp to balance
    const validAmount = Math.max(0, Math.min(amount, this.team.balance));
    this.bidChange.emit(validAmount);
  }

  onAnswer(correct: boolean) {
    if (!this.answerEnabled) return; // ignore clicks until timer started
    this.answer.emit(correct);
  }
}
