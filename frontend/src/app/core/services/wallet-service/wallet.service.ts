import { Injectable, signal } from '@angular/core';
import {
  DAppConnector,
  HederaChainId,
  HederaJsonRpcMethod,
  HederaSessionEvent,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';
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
  dAppConnector = new DAppConnector(
    this.metadata,
    LedgerId.TESTNET,
    environment.walletProjectId,
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
    [HederaChainId.Mainnet, HederaChainId.Testnet]
  );
  accounts = signal<string[]>([]);
  topic = signal('');
  isConnected = signal(false);

  async connect() {
    await this.dAppConnector.init({ logger: 'error' });
    const modalResponse = await this.dAppConnector.openModal();
    if (modalResponse.acknowledged) {
      this.topic.set(modalResponse.topic);
      this.isConnected.set(true);
      this.accounts.set(modalResponse.namespaces['hedera'].accounts);
    }
    console.log(this.topic());
    console.log(this.isConnected());
  }
  async disconnect() {
    const isDisconnected = await this.dAppConnector.disconnect(this.topic());
    if (isDisconnected) {
      this.topic.set('');
      this.isConnected.set(false);
      this.accounts.set([]);
    }
    console.log(this.topic());
    console.log(this.isConnected());
    return isDisconnected;
  }
}
