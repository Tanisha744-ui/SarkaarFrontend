import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  template: `
    <div class="loader-overlay" *ngIf="isLoading">
      <div class="loader"></div>
      <p *ngIf="loadingMessage">{{ loadingMessage }}</p>
    </div>
  `,
  styles: [
    `
      .loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .loader {
        border: 8px solid #f3f3f3;
        border-top: 8px solid #3498db;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      p {
        margin-top: 10px;
        font-size: 1.2rem;
        color: #333;
      }
    `,
  ],
  imports: [CommonModule],
})
export class LoaderComponent {
  @Input() isLoading: boolean = false;
  @Input() loadingMessage: string = '';
}