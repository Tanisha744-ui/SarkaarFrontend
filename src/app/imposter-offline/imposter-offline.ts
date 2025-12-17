import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ImposterCard {
  revealed: boolean;
  seen: boolean;
  word: string;
  isImposter: boolean;
}

@Component({
  selector: 'app-imposter-offline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imposter-offline.html',
  styleUrls: ['./imposter-offline.css']
})
export class ImposterOffline {
  playerCount = 3;
  cards: ImposterCard[] = [];
  currentlyRevealed: number | null = null;

  generateCards() {
    // Example words, you can randomize or fetch from a list
    const commonWord = 'Apple';
    const imposterWord = 'Orange';
    const imposterIndex = Math.floor(Math.random() * this.playerCount);

    this.cards = Array.from({ length: this.playerCount }, (_, i) => ({
      revealed: false,
      seen: false,
      word: i === imposterIndex ? imposterWord : commonWord,
      isImposter: i === imposterIndex
    }));
    this.currentlyRevealed = null;
  }

  canReveal(i: number): boolean {
    // Only allow reveal if no card is currently revealed and this card is not seen
    return !this.cards[i].seen && (this.currentlyRevealed === null || this.currentlyRevealed === i);
  }

  revealCard(i: number) {
    if (this.cards[i].seen || (this.currentlyRevealed !== null && this.currentlyRevealed !== i)) return;
    this.cards[i].revealed = true;
    this.currentlyRevealed = i;
  }

  hideCard(i: number) {
    this.cards[i].revealed = false;
    this.cards[i].seen = true;
    this.currentlyRevealed = null;
  }
}