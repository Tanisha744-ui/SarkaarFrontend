import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-end-game-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title><b>{{ data?.title || 'Are you sure?' }}</b></h2>
    <mat-dialog-content>
      {{ data?.content || 'This will permanently end the game for everyone and close the room. This action cannot be undone.' }}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close cdkFocusInitial>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">{{ data?.confirmText || 'Yes, End Game' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Dialog background is now controlled by global .custom-dialog-bg class for consistency */
    h2 { font-weight: bold; color: white !important; font-size: 1.5rem !important; margin-bottom: 6px; }
    mat-dialog-content { margin-top: 5px; margin-bottom: 5px; display: block; color: white !important; font-size: 1.1rem !important; }
    mat-dialog-actions { gap: 6px; }
    button { font-size: 1.1rem !important; border-radius: 8px !important; }
    button[mat-raised-button] { background-color: #d32f2f !important; color: white !important; }
    button[mat-raised-button]:hover { background-color: #b71c1c !important; }
    button[mat-button] { color: #ccc !important; border-radius: 8px !important; }  
    button[mat-button]:hover { background-color: rgba(255, 255, 255, 0.1) !important; }
  `]
})
export class EndGameDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
