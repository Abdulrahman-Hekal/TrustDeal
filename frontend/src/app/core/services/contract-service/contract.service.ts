import { inject, Injectable, signal } from '@angular/core';
import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractCallQuery,
  Client,
  Hbar,
  AccountBalanceQuery,
} from '@hashgraph/sdk';
import { WalletService } from '../wallet-service/wallet.service';
import { environment } from '../../../../environments/environment';
import { transactionToBase64String } from '@hashgraph/hedera-wallet-connect';

export interface ProjectEvent {
  name: string;
  projectId: number;
  data?: any;
  txHash?: string;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private readonly _walletService = inject(WalletService);
  private readonly contractId = environment.contractId;
  private readonly client = Client.forTestnet();

  events = signal<ProjectEvent[]>([]);

  /********************** Smart Contract Methods **********************/

  async createProjectHBAR(
    freelancer: string,
    approvalWindowSec: number,
    deliveryDeadlineSec: number,
    amountHBAR: string
  ) {
    const tx = new ContractExecuteTransaction()
      .setContractId(this.contractId)
      .setGas(100_000)
      .setPayableAmount(new Hbar(Number(amountHBAR)))
      .setFunction(
        'createProjectHBAR',
        new ContractFunctionParameters()
          .addAddress(freelancer)
          .addUint256(approvalWindowSec)
          .addUint256(deliveryDeadlineSec)
      );

    return await this.signAndExecute(tx, 'ProjectCreated', {
      freelancer,
      amountHBAR,
    });
  }

  async deliverWork(projectId: number, previewHash: string) {
    return this.signAndExecute(
      new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(100_000)
        .setFunction(
          'deliverWork',
          new ContractFunctionParameters().addUint256(projectId).addString(previewHash)
        ),
      'WorkDelivered'
    );
  }

  async approveWork(projectId: number) {
    return this.signAndExecute(
      new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(100_000)
        .setFunction('approveWork', new ContractFunctionParameters().addUint256(projectId)),
      'WorkApproved'
    );
  }

  async requestRefund(projectId: number) {
    return this.signAndExecute(
      new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(100_000)
        .setFunction('requestRefund', new ContractFunctionParameters().addUint256(projectId)),
      'RefundIssued'
    );
  }

  async withdraw(projectId: number) {
    return this.signAndExecute(
      new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(100_000)
        .setFunction('withdraw', new ContractFunctionParameters().addUint256(projectId)),
      'Withdrawn'
    );
  }

  async autoRefundIfLate(projectId: number) {
    return this.signAndExecute(
      new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(100_000)
        .setFunction('autoRefundIfLate', new ContractFunctionParameters().addUint256(projectId)),
      'AutoRefunded'
    );
  }

  async autoApproveIfClientSilent(projectId: number) {
    return this.signAndExecute(
      new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(100_000)
        .setFunction(
          'autoApproveIfClientSilent',
          new ContractFunctionParameters().addUint256(projectId)
        ),
      'AutoApproved'
    );
  }

  async getProject(projectId: number) {
    const query = new ContractCallQuery()
      .setContractId(this.contractId)
      .setGas(50_000)
      .setFunction('getProject', new ContractFunctionParameters().addUint256(projectId));

    const result = await query.execute(this.client);
    return result;
  }

  async getBalance(): Promise<string> {
    const accountBalanceQuery = new AccountBalanceQuery().setAccountId(
      this._walletService.accountId()
    );
    const accountBalance = await accountBalanceQuery.execute(this.client);
    return accountBalance.hbars.toString();
  }

  /********************** Helpers **********************/

  /** ✅ Unified execute handler */
  private async signAndExecute(
    tx: ContractExecuteTransaction,
    eventName: string,
    data?: any
  ): Promise<string> {
    // ✅ Ask wallet to sign and execute
    const params = {
      signerAccountId: this._walletService.accountId(),
      transactionList: transactionToBase64String(tx),
    };
    const response = await this._walletService.dAppConnector.signAndExecuteTransaction(params);

    // Extract transaction ID
    const txId = response.result.transactionId;
    this.addEvent(eventName, 0, data, txId);

    console.log(`${eventName} executed: https://hashscan.io/testnet/transaction/${txId}`);
    return txId;
  }

  private addEvent(name: string, projectId: number, data?: any, txHash?: string) {
    const event: ProjectEvent = {
      name,
      projectId,
      data,
      txHash,
      timestamp: Date.now(),
    };
    this.events.update((prev) => [event, ...prev]);
  }
}
