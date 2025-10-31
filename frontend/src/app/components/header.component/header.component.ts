import { Component, inject, OnInit, signal } from '@angular/core';
import { WalletService } from '../../core/services/wallet-service/wallet.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ContractService } from '../../core/services/contract-service/contract.service';

@Component({
  selector: 'app-header-component',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  accountId = signal('');
  isConnected = signal(false);
  isToggle: boolean = false;

  private readonly _walletService = inject(WalletService);

  ngOnInit() {
    this.accountId = this._walletService.accountId;
    this.isConnected = this._walletService.isConnected;
  }

  async connect() {
    await this._walletService.connect();
  }

  disconnect() {
    this._walletService.disconnect();
  }

  openNav() {
    this.isToggle = !this.isToggle;
  }
}
