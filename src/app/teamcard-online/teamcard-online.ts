import { NgClass, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoaderComponent } from '../shared/loader/loader.component';

interface TeamData {
  teamId: string;
  name: string;
  balance: number;
  currentBid?: number;
  gameId?: number;
}
import { BidService, CreateBidDto } from '../services/bid.service';

@Component({
  selector: 'app-teamcard-online',
  standalone: true,
  imports: [NgClass, NgIf, FormsModule, LoaderComponent],
  templateUrl: './teamcard-online.html',
  styleUrl: './teamcard-online.css',
})
export class TeamcardOnline implements OnChanges {
    private bidService = inject(BidService);
  @Input() team!: TeamData;
  @Input() isLocked: boolean = false;
  @Input() isActive: boolean = false;
  @Input() answerEnabled: boolean = false;
  @Input() resultState: 'none' | 'correct' | 'wrong' = 'none';
  // New inputs for bid logic
  @Input() minimumBid: number = 0;
  @Input() bidInterval: number = 10;
  @Input() maxBidAmount?: number;
  @Input() canBid: boolean = false;

  @Output() bidChange = new EventEmitter<number>();
  @Output() answer = new EventEmitter<boolean>();

  currentBidAmount: number | undefined;
  stepCount: number = 10; // fallback, but use bidInterval if provided
  isLoading: boolean = false; // New state for loader
  loadingMessage: string = ''; // Add missing property

  // Helper method to safely check if bid exceeds balance
  isBidExceedingBalance(): boolean {
    return this.currentBidAmount !== undefined && this.currentBidAmount > this.team.balance;
  }

  ngOnInit() {
    // Don't set initial value, let placeholder show
    this.currentBidAmount = undefined;
    // this.setTeamBalanceFromMaxBid();
    // Use bidInterval if provided
    if (this.bidInterval && this.bidInterval > 0) {
      this.stepCount = this.bidInterval;
    } else {
      const stepStr = localStorage.getItem('stepCount');
      if (stepStr) {
        const step = parseInt(stepStr, 10);
        if (!isNaN(step)) {
          this.stepCount = step;
        }
      }
    }
  }

  // setTeamBalanceFromMaxBid() {
  //   const maxBidStr = localStorage.getItem('maxBid');
  //   if (maxBidStr && this.team) {
  //     const maxBid = parseInt(maxBidStr, 10);
  //     if (!isNaN(maxBid)) {
  //       this.team.balance = maxBid;
  //     }
  //   }
  // }

  ngOnChanges(changes: SimpleChanges) {
    // Keep local input value in sync when parent updates team.currentBid (e.g., reset to 0)
    if (changes['team'] && this.team) {
      this.currentBidAmount = this.team.currentBid ?? 0;
      // this.setTeamBalanceFromMaxBid();
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

    const interval = this.bidInterval > 0 ? this.bidInterval : 10;
    let roundedAmount = Math.round(amount / interval) * interval;
    if (amount % interval === interval / 2) {
      roundedAmount = Math.ceil(amount / interval) * interval;
    }
    // If entered amount is less than minimumBid, assign minimumBid
    if (amount < this.minimumBid) {
      roundedAmount = this.minimumBid;
    }
    // If entered amount is less than currentBid, assign next higher interval above currentBid
    if (this.team.currentBid !== undefined && roundedAmount < this.team.currentBid) {
      roundedAmount = Math.ceil((this.team.currentBid + 1) / interval) * interval;
      if (roundedAmount < this.minimumBid) {
        roundedAmount = this.minimumBid;
      }
    }
    // Clamp to [minimumBid, balance]
    roundedAmount = Math.max(this.minimumBid, Math.min(roundedAmount, this.team.balance));
    this.currentBidAmount = roundedAmount;

    // Simulate bid submission process (replace with actual service call if needed)
    // this.bidService.createBid({ teamId: parseInt(this.team.teamId, 10), amount: roundedAmount }).subscribe({
    //   next: () => {
    //     // Bid submission successful
    //   },
    //   error: () => {
    //     // Handle bid submission error
    //   }
    // });

    this.bidChange.emit(roundedAmount);
  }

  onAnswer(correct: boolean) {
    if (!this.answerEnabled) return; // ignore clicks until timer started
    this.answer.emit(correct);
  }
  changeBid(direction: 'up' | 'down') {
    if (this.isLocked) return;
    let value = this.currentBidAmount ?? 0;
    const step = this.bidInterval > 0 ? this.bidInterval : this.stepCount;
    const max = this.maxBidAmount ?? this.team.balance;
    if (direction === 'up') {
      // If value is less than minimumBid, jump to minimumBid
      if (value < this.minimumBid) {
        value = this.minimumBid;
      } else {
        value += step;
      }
    } else {
      value -= step;
    }
    // Clamp to [0, maxBidAmount or balance]
    value = Math.max(0, Math.min(value, max));
    this.currentBidAmount = value;
  }
}
