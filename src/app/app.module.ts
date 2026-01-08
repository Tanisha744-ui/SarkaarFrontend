import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { App as AppComponent } from './app';
import { Tambola } from './tambola/tambola';
import { DialogContent } from './tambola/tambola';


@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatDialogModule,
    AppComponent,
    Tambola,
    DialogContent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }