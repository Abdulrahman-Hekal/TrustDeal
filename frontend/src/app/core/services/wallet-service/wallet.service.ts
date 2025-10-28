import { Injectable } from '@angular/core';
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
  private readonly dAppConnector = new DAppConnector(
    this.metadata,
    LedgerId.TESTNET,
    environment.walletProjectId,
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
    [HederaChainId.Mainnet, HederaChainId.Testnet]
  );

  async connect() {
    await this.dAppConnector.init({ logger: 'error' });
    await this.dAppConnector.openModal();
  }
}
