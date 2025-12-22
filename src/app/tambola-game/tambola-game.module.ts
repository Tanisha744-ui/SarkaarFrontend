import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TambolaGame } from './tambola-game';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TambolaGame
  ]
})
export class TambolaGameModule {}