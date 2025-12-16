import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.html',
  styleUrl: './timer.css',
})
export class Timer implements OnDestroy {
  @Input() duration = 60; // seconds
  @Output() tick = new EventEmitter<number>();
  @Output() finished = new EventEmitter<void>();

  remaining: number = this.duration;
  running = false;
  private _intervalId: any = null;

  start() {
    if (this.running) return;
    if (this.remaining <= 0) {
      this.reset();
    }
    this.running = true;
    this._intervalId = setInterval(() => {
      if (this.remaining > 0) {
        this.remaining -= 1;
        this.tick.emit(this.remaining);
      }
      if (this.remaining <= 0) {
        this.finish();
      }
    }, 1000);
  }

  // We keep stop private because UI only exposes start and restart per request
  private stop() {
    if (!this.running) return;
    this.running = false;
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  reset() {
    this.stop();
    this.remaining = this.duration;
    this.tick.emit(this.remaining);
  }

  restart() {
    this.reset();
    this.start();
  }

  private finish() {
    this.stop();
    this.finished.emit();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  formatTime(sec: number) {
    const mm = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = (sec % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }
}
