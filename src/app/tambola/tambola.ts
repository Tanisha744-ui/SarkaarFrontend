import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-tambola',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule,],
  templateUrl: './tambola.html',
  styleUrls: ['./tambola.css']
})
export class Tambola {
  numPlayers: number = 2;
  playerNames: string[] = [];  constructor(private router: Router, @Inject(MatDialog) private dialog: MatDialog) {
    this.updatePlayerFields();
  }

  updatePlayerFields() {
    const currentLength = this.playerNames.length;
    if (this.numPlayers > currentLength) {
      // Add empty fields if numPlayers increases
      this.playerNames.push(...Array(this.numPlayers - currentLength).fill(''));
    } else if (this.numPlayers < currentLength) {
      // Remove extra fields if numPlayers decreases
      this.playerNames.splice(this.numPlayers);
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
  openOfflineGameDialog() {
    const dialogRef = this.dialog.open(DialogContent, {
      width: '300px'
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.router.navigate(['/tambola-game'], {
          queryParams: {
            interval: result.interval,
            autoCall: result.autoCall, // Pass Auto Call state as query parameter
            announceNumbers: result.announceNumbers // Pass Announce Numbers state as query parameter
          }
        });
      }
    });
  }
  areAllNamesValid(): boolean {
    return this.playerNames.every(name => name.trim().length >= 3);
  }

  navigateToOnline() {
    this.router.navigate(['/tambola-online']);
  }

  navigateToOffline() {
    this.openOfflineGameDialog(); // Open the dialog for offline game setup
  }
}

// Inline dialog content
@Component({
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-box">
      <h2 mat-dialog-title>Offline Game Setup</h2>
      <div mat-dialog-content>
        <label for="callingInterval">Select Calling Interval:</label>
        <select id="callingInterval" name="callingInterval" [(ngModel)]="selectedInterval">
          <option *ngFor="let interval of intervals" [value]="interval">{{ interval }} seconds</option>
        </select>
        <label>
          <input type="checkbox" [(ngModel)]="autoCallEnabled" checked /> Enable Auto Call
        </label>
        <label>
          <input type="checkbox" [(ngModel)]="announceNumbersEnabled" /> Announce Numbers
        </label>
      </div>
      <div mat-dialog-actions>
        <button mat-button class="cancel-button" (click)="onCancel()">Cancel</button>
        <button mat-button class="start-button" (click)="onConfirm()">Start</button>
      </div>
    </div>
  `,
  styles: [
    `.dialog-box {
      background: #1e1e2f;
      color: white;
      padding: 20px;
    }
    label {
      display: block;
      margin: 8px 0 4px;
    }
    .cancel-button {
      margin-right: 8px;
      color: white;
    }
    .start-button {
      margin-left: 90px;
      color: white;
    }
    select {
      width: 100%;
      padding: 8px;
      margin-bottom: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }`
  ],
})
export class DialogContent {
  intervals: number[] = [3, 5, 10, 15];
  selectedInterval: number = 3;
  autoCallEnabled: boolean = true; // Default Auto Call to ON
  announceNumbersEnabled: boolean = false; // Default Announce Numbers to OFF

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DialogContent>
  ) {
    this.announceNumbersEnabled = data?.announceNumbers || false; // Initialize from data
  }

  onCancel(): void {
    this.dialogRef.close(false); // Close dialog without action
  }

  onConfirm(): void {
    this.dialogRef.close({ interval: this.selectedInterval, autoCall: this.autoCallEnabled, announceNumbers: this.announceNumbersEnabled }); // Pass interval, Auto Call state, and Announce Numbers state
  }
}
