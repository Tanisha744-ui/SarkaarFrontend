import { Component, OnInit } from '@angular/core';
import { RouterLink, Routes } from '@angular/router';


@Component({
  selector: 'app-index',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './index.html',
  styleUrl: './index.css',
})
export class Index implements OnInit {
  username: string = '';

  ngOnInit() {
    this.username = localStorage.getItem('username') || 'Player';
  }

  logout() {
    localStorage.removeItem('username');
    window.location.href = '/login';
  }
}
