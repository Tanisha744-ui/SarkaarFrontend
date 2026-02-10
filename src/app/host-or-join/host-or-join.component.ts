import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { PartyService } from '../services/party.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-host-or-join',
  templateUrl: './host-or-join.component.html',
  styleUrls: ['./host-or-join.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class HostOrJoinComponent implements OnInit {
  @Input() playerName: string = ''; // Receive player name from parent or route
  partyCodeInput: string = '';
  showBanner: boolean = false;
  bannerMessage: string = '';
  bannerBold: string = '';
  bannerTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private partyService: PartyService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.playerName = params['playerName'] || '';
      if (params['banner'] === 'host-ended') {
        this.bannerBold = 'Game Ended';
        this.bannerMessage = 'The host has ended the game.';
        this.showBanner = true;
        clearTimeout(this.bannerTimeout);
        this.bannerTimeout = setTimeout(() => {
          this.showBanner = false;
        }, 5000);
      }
    });
  }

  hostParty() {
    if (!this.playerName) {
      alert('Please enter your name before hosting.');
      return;
    }
    this.partyService.createParty(this.playerName).subscribe({
      next: (res) => {
        this.router.navigate(['/playfriends'], {
          queryParams: {
            partyCode: res.partyCode,
            hostName: res.hostName,
            playerName: this.playerName,
            isHost: true
          }
        });
      },
      error: () => alert('Failed to create party. Please try again.')
    });
  }

  joinParty() {
    if (!this.playerName || !this.partyCodeInput) {
      this.bannerBold = 'Missing Info';
      this.bannerMessage = 'Please enter your name and party code.';
      this.showBanner = true;
      clearTimeout(this.bannerTimeout);
      this.bannerTimeout = setTimeout(() => {
        this.showBanner = false;
      }, 3500);
      return;
    }
    this.partyService.joinParty(this.partyCodeInput, this.playerName).subscribe({
      next: (res) => {
        if (res && res.error) {
          this.bannerBold = 'Cannot Join';
          this.bannerMessage = res.error;
          this.showBanner = true;
          clearTimeout(this.bannerTimeout);
          this.bannerTimeout = setTimeout(() => {
            this.showBanner = false;
          }, 3500);
        } else {
          this.router.navigate(['/playfriends'], {
            queryParams: {
              partyCode: res.partyCode,
              hostName: res.hostName,
              playerName: this.playerName,
              isHost: false
            }
          });
        }
      },
      error: (err) => {
        let msg = 'Failed to join party. Please check the code and try again.';
        if (err && err.error && typeof err.error === 'string') {
          msg = err.error;
        } else if (err && err.error && err.error.error) {
          msg = err.error.error;
        }
        this.bannerBold = 'Cannot Join';
        this.bannerMessage = msg;
        this.showBanner = true;
        clearTimeout(this.bannerTimeout);
        this.bannerTimeout = setTimeout(() => {
          this.showBanner = false;
        }, 3500);
      }
    });
  }
}