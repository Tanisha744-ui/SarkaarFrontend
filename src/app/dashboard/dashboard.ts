import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Team {
  name: string;
  members: string[];
}

@Component({
  selector: 'app-dashboard',
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  teams: Team[] = [];
  newTeamName: string = '';
  userName: string = '';
  joinedTeam: string | null = null;

  constructor(private router: Router) {}

  createTeam() {
    if (
      this.newTeamName.trim() &&
      this.teams.length < 4 &&
      !this.teams.some(t => t.name.toLowerCase() === this.newTeamName.trim().toLowerCase())
    ) {
      this.teams.push({ name: this.newTeamName.trim(), members: [] });
      this.newTeamName = '';
    }
  }

  joinTeam(team: Team) {
    if (this.userName.trim() && !team.members.includes(this.userName.trim())) {
      team.members.push(this.userName.trim());
      this.joinedTeam = team.name;
    }
  }

  canProceed(): boolean {
    return (
      this.teams.length >0 &&
      this.teams.every(t => t.members.length > 0)
    );
  }

  startGame() {
    // Pass team names to game page (could use a service or router state)
    // For now, use localStorage for simplicity
    localStorage.setItem('teamNames', JSON.stringify(this.teams.map(t => t.name)));
    this.router.navigate(['/game']);
  }
}
