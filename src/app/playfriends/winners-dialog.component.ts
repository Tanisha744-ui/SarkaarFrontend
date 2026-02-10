import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
	selector: 'app-winners-dialog',
	templateUrl: './winners-dialog.component.html',
	styleUrls: ['./winners-dialog.component.css'],
	standalone: true,
	imports: [CommonModule, UpperCasePipe]
})
export class WinnersDialogComponent {
	objectKeys = Object.keys;
	claimedbonuses: { [key: string]: string } = {};
	bonusNameMap: { [key: string]: string } = {
		firstLine: 'First Line',
		secondLine: 'Second Line',
		thirdLine: 'Third Line',
		fullHouse: 'Full House',
		earlyFive: 'Early Five',
	};

	playerName: string = '';

	@Output() goLobby = new EventEmitter<void>();

	constructor(@Inject(MAT_DIALOG_DATA) public data: any, private router: Router) {
		if (data) {
			this.claimedbonuses = data.claimedbonuses || {};
			if (data.bonusNameMap) {
				this.bonusNameMap = data.bonusNameMap;
			}
			if (data.playerName) {
				this.playerName = data.playerName;
			}
		}
	}

	goToLobby() {
		this.goLobby.emit();
	}
}
