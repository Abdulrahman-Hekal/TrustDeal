import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WalletService } from './core/services/wallet-service/wallet.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');
  private readonly wallet = inject(WalletService);
  isConnected = signal(false);
  ngOnInit() {
    this.isConnected = this.wallet.isConnected;
  }
  connect() {
    this.wallet.connect();
  }
  disconnect() {
    this.wallet.disconnect();
  }
}
