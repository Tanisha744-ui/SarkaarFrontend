import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-selection.html',
  styleUrl: './team-selection.css',
})
export class TeamSelection {
  teamCount: number = 2;
  teamNumbers: number[] = Array.from({ length: 9 }, (_, i) => i + 2); // 2-10
  teamNames = Array.from({ length: 2 }, () => '');
  currentInputIndex: number = 0;
  maxBid: number = 1000;
  nameError: string = '';
  stepOptions: number[] = [1, 2, 5, 10, 20, 25, 50, 100];
  stepCount: number = 10;

  constructor(private router: Router) {
    this.updateFilledTeamNamesAndGroups();
  }

  onTeamCountChange() {
    this.teamNames = Array.from(
      { length: this.teamCount },
      (_, i) => this.teamNames[i] || ''
    );
    if (this.currentInputIndex >= this.teamCount) {
      this.currentInputIndex = this.teamCount - 1;
    }
    this.nameError = '';
    this.updateFilledTeamNamesAndGroups();
  }
  filledTeamNames: string[] = [];
  filledTeamNameGroups: string[][] = [];

  updateFilledTeamNamesAndGroups() {
    this.filledTeamNames = this.teamNames.slice(0, this.currentInputIndex).filter(name => name && name.trim().length > 0);
    this.filledTeamNameGroups = [];
    for (let i = 0; i < this.filledTeamNames.length; i += 5) {
      this.filledTeamNameGroups.push(this.filledTeamNames.slice(i, i + 5));
    }
  }

  // Call this method whenever teamNames or currentInputIndex changes
  isDuplicateName(name: string, index: number): boolean {
    const trimmed = name.trim().toLowerCase();
    return (
      trimmed.length > 0 &&
      this.teamNames.some((n, i) => i !== index && n.trim().toLowerCase() === trimmed)
    );
  }

  nextTeamInput() {
    const name = this.teamNames[this.currentInputIndex].trim();
    if (name.length === 0) {
      this.nameError = '';
      return;
    }
    if (this.isDuplicateName(name, this.currentInputIndex)) {
      this.nameError = 'This name is already taken.';
      return;
    }
    this.nameError = '';
    if (this.currentInputIndex < this.teamCount - 1) {
      this.currentInputIndex++;
    } else {
      // All names entered, hide input
      this.currentInputIndex++;
    }
    this.updateFilledTeamNamesAndGroups();
  }

  prevTeamInput() {
    if (this.currentInputIndex > 0) {
      this.currentInputIndex--;
    }
    this.nameError = '';
    this.updateFilledTeamNamesAndGroups();
  }

  canProceed(): boolean {
    // All names must be filled, no duplicates, maxBid > 0, and input is hidden (user finished entering names)
    const namesTrimmed = this.teamNames.map(n => n.trim().toLowerCase());
    const uniqueNames = new Set(namesTrimmed.filter(n => n.length > 0));
    return (
      this.teamNames.every(name => name.trim().length > 0) &&
      uniqueNames.size === this.teamNames.length &&
      this.maxBid > 0 &&
      this.currentInputIndex >= this.teamCount
    );
  }

  proceed() {
    // Save team names to localStorage
    localStorage.setItem('teamNames', JSON.stringify(this.teamNames));
    localStorage.setItem('maxBid', String(this.maxBid));
    localStorage.setItem('stepCount', String(this.stepCount));
    this.router.navigate(['/game']);
  }
}
