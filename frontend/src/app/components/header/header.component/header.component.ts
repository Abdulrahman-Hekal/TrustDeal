import { Component, inject, OnInit, signal } from '@angular/core';
import { WalletService } from '../../../core/services/wallet-service/wallet.service';

@Component({
  selector: 'app-header-component',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  accountId = signal('');
  isConnected = signal(false);
  private readonly _walletService = inject(WalletService);

  ngOnInit() {
    this.accountId = this._walletService.accountId;
    this.isConnected = this._walletService.isConnected;
  }

  connect() {
    this._walletService.connect();
  }
  disconnect() {
    this._walletService.disconnect();
  }
}
