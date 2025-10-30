import { Component, inject, OnInit, signal } from '@angular/core';
import { WalletService } from '../../core/services/wallet-service/wallet.service';
import { RouterLink } from '@angular/router';
import { ContractService } from '../../core/services/contract-service/contract.service';

@Component({
  selector: 'app-header-component',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  accountId = signal('');
  isConnected = signal(false);
  isToggle: boolean = false;
  private readonly _walletService = inject(WalletService);
  private readonly _contractService = inject(ContractService);

  ngOnInit() {
    this.accountId = this._walletService.accountId;
    this.isConnected = this._walletService.isConnected;
  }

  connect() {
    this._walletService.connect();
    this._contractService.initContract();
  }
  disconnect() {
    this._walletService.disconnect();
  }

  openNav() {
    this.isToggle = !this.isToggle;
  }
}
