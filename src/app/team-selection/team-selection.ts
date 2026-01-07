import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-team-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-selection.html',
  styleUrl: './team-selection.css',
})
export class TeamSelection {
  teamCount = 2;
  teamNumbers = Array.from({ length: 9 }, (_, i) => i + 2);

  teamNames: string[] = ['', ''];
  filledTeamNames: string[] = [];

  currentInputIndex = 0;
  maxBid = 1000;
  stepCount = 10;
  nameError = '';

  constructor(private router: Router) {}

  onTeamCountChange() {
    this.teamNames = Array.from(
      { length: this.teamCount },
      (_, i) => this.teamNames[i] || ''
    );

    this.currentInputIndex = Math.min(this.currentInputIndex, this.teamCount - 1);
    this.updateFilledNames();
  }

  isDuplicate(name: string, index: number): boolean {
    const n = name.trim().toLowerCase();
    return this.teamNames.some(
      (t, i) => i !== index && t.trim().toLowerCase() === n
    );
  }

  nextTeamInput() {
    if (this.currentInputIndex >= this.teamCount) return;
    const name = this.teamNames[this.currentInputIndex].trim();
    if (!name) return;

    if (this.isDuplicate(name, this.currentInputIndex)) {
      this.nameError = 'This team name already exists';
      return;
    }

    this.nameError = '';
    this.currentInputIndex++;
    if (this.currentInputIndex > this.teamCount) {
      this.currentInputIndex = this.teamCount;
    }
    this.updateFilledNames();
  }

  updateFilledNames() {
    this.filledTeamNames = this.teamNames
      .slice(0, Math.min(this.currentInputIndex, this.teamCount))
      .filter(n => n.trim().length > 0);
  }

  canProceed(): boolean {
    const names = this.teamNames.map(n => n.trim());
    return (
      names.every(n => n.length > 0) &&
      new Set(names).size === names.length &&
      this.currentInputIndex >= this.teamCount
    );
  }

  proceed() {
    localStorage.setItem('teamNames', JSON.stringify(this.teamNames));
    localStorage.setItem('maxBid', String(this.maxBid));
    localStorage.setItem('stepCount', String(this.stepCount));
    this.router.navigate(['/game']);
  }
}
