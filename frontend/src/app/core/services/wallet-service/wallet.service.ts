import { Injectable, signal } from '@angular/core';
import {
  DAppConnector,
  HederaChainId,
  HederaJsonRpcMethod,
  HederaSessionEvent,
} from '@hashgraph/hedera-wallet-connect';
import { AccountId, LedgerId } from '@hashgraph/sdk';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private readonly metadata = {
    name: environment.appName,
    description: environment.appDesc,
    url: globalThis.location.origin, // Must match your domain
    icons: [`${globalThis.location.origin}/${environment.appIcon}`],
  };
  readonly dAppConnector = new DAppConnector(
    this.metadata,
    LedgerId.TESTNET,
    environment.walletProjectId,
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
    [HederaChainId.Mainnet, HederaChainId.Testnet]
  );
  private readonly topic = signal('');

  accountId = signal('');
  isConnected = signal(false);

  async connect() {
    try {
      await this.dAppConnector.init();
      const modalResponse = await this.dAppConnector.openModal();
      if (modalResponse.acknowledged) {
        this.topic.set(modalResponse.topic);
        this.isConnected.set(true);
        const accounts = modalResponse.namespaces['hedera'].accounts;
        this.accountId.set(accounts[0].split(':').at(-1) ?? '');
      }
    } catch (err) {
      console.error('Wallet connect error:', err);
    }
  }

  async disconnect() {
    const isDisconnected = await this.dAppConnector.disconnect(this.topic());
    if (isDisconnected) {
      this.topic.set('');
      this.isConnected.set(false);
      this.accountId.set('');
    }
    return isDisconnected;
  }

  getAccountAddress(accountId: string = this.accountId()) {
    const account = AccountId.fromString(accountId);
    return `0x${account.toEvmAddress()}`;
  }

  getAccountIdFromAddress(address: string) {
    return AccountId.fromEvmAddress(0, 0, address);
  }

  getAccountId() {
    return AccountId.fromString(this.accountId());
  }
}
