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

  // 🔹 SAME TYPE OF WORD SETS AS BACKEND
  private wordSets: string[][] = [
    ['Airport', 'Boarding'],
    ['Hospital', 'Medicine'],
    ['School', 'Homework'],
    ['Restaurant', 'Menu'],
    ['Cinema', 'Trailer'],
    ['Hotel', 'Keycard'],
    ['Gym', 'Weights'],
    ['Library', 'Study'],
    ['Office', 'Meeting'],
    ['Station', 'Platform'],
    ['Pizza', 'Cheese'],
    ['Burger', 'Sauce'],
    ['Coffee', 'Caffeine'],
    ['Ice Cream', 'Cone'],
    ['Sandwich', 'Toast'],
    ['Cake', 'Slice'],
    ['Pasta', 'Boil'],
    ['Soup', 'Steam'],
    ['Chocolate', 'Bitter'],
    ['Phone', 'Battery'],
    ['Laptop', 'Charger'],
    ['Camera', 'Zoom'],
    ['Car', 'Fuel'],
    ['Rain', 'Umbrella'],
    ['Beach', 'Sand'],
    ['Forest', 'Trees'],
    ['Fire', 'Smoke'],
    ['Night', 'Dark'],
    ['Bread', 'Fresh'],
    ['Dog', 'Tail']
  ];

  // 🎯 Generate cards with random words every time
  generateCards() {
    const randomSet =
      this.wordSets[Math.floor(Math.random() * this.wordSets.length)];

    const commonWord = randomSet[0];
    const imposterWord = randomSet[1];

    const imposterIndex = Math.floor(Math.random() * this.playerCount);

    this.cards = Array.from({ length: this.playerCount }, (_, i) => ({
      revealed: false,
      seen: false,
      word: i === imposterIndex ? imposterWord : commonWord,
      isImposter: i === imposterIndex
    }));

    this.currentlyRevealed = null;
  }

  // 🔐 Allow only one card reveal at a time
  canReveal(i: number): boolean {
    return (
      !this.cards[i].seen &&
      (this.currentlyRevealed === null || this.currentlyRevealed === i)
    );
  }

  // 👁 Reveal card
  revealCard(i: number) {
    if (
      this.cards[i].seen ||
      (this.currentlyRevealed !== null && this.currentlyRevealed !== i)
    ) {
      return;
    }

    this.cards[i].revealed = true;
    this.currentlyRevealed = i;
  }

  // 🙈 Hide card after viewing
  hideCard(i: number) {
    this.cards[i].revealed = false;
    this.cards[i].seen = true;
    this.currentlyRevealed = null;
  }
}
