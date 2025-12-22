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

  constructor(private router: Router) {}

  onTeamCountChange() {
    this.teamNames = Array.from(
      { length: this.teamCount },
      (_, i) => this.teamNames[i] || ''
    );
  }

  trackByIndex(index: number): number {
    return index;
  }

  canProceed(): boolean {
    return this.teamNames.every(name => name.trim().length > 0);
  }

  proceed() {
    // Save team names to localStorage
    localStorage.setItem('teamNames', JSON.stringify(this.teamNames));
    this.router.navigate(['/game']);
  }
}
