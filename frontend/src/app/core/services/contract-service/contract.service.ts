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
import { Interface } from 'ethers';
import contract from '../../contract/TrustDealEscrow.json'

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

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async createProjectHBAR(
    freelancer: string,
    approvalWindowSec: number,
    deliveryDeadlineSec: number,
    amountHBAR: string
  ) {
    const tx = new ContractExecuteTransaction()
      .setContractId(this.contractId)
      .setGas(900_000)
      .setPayableAmount(new Hbar(Number(amountHBAR)))
      .setFunction(
        'createProjectHBAR',
        new ContractFunctionParameters()
          .addAddress(freelancer)
          .addUint256(approvalWindowSec)
          .addUint256(deliveryDeadlineSec)
      );

    const txId = await this.signAndExecute(tx, 'ProjectCreated', {
      freelancer,
      amountHBAR,
    });

    console.log('txId2: ', txId);

    await this.sleep(8000);

    return await this.getProjectIdFromEvent(txId);
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
  ): Promise<any> {
    // ✅ Ask wallet to sign and execute
    const params = {
      signerAccountId: this._walletService.accountId(),
      transactionList: transactionToBase64String(tx),
    };
    const res = (await this._walletService.dAppConnector.signAndExecuteTransaction(params)) as any;

    // // Extract transaction ID
    console.log('txId: ', res.transactionId);
    return res.transactionId;
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

  async getProjectIdFromEvent(txId: string): Promise<number | null> {
    const arr = txId.split('@');
    const newTxId = arr[0] + '-' + arr[1].replace('.', '-');
    console.log(newTxId);
    const url = `https://testnet.mirrornode.hedera.com/api/v1/contracts/results/${newTxId}`;
    const res = await fetch(url);
    const data = await res.json();

    // Check the logs for "ProjectCreated"
    console.log(data);
    const logs = data.logs;
    if (!logs || logs.length === 0) {
        throw new Error("No logs found for this transaction.");
    }

    const iface = new Interface(contract.abi);
    let projectId = null;
    console.log(logs);

    for (const log of logs) {
        try {
            // The log data from the mirror node needs to be formatted for ethers
            const formattedLog = {
                topics: log.topics.map((topic: any) => topic),
                data: log.data
            };

            const parsedEvent = iface.parseLog(formattedLog);

            console.log(parsedEvent)

            // Check if the parsed event is the one we are looking for
            if (parsedEvent?.name === "ProjectCreated") {
                console.log("Found ProjectCreated event!");
                // Extract the projectId from the event arguments
                projectId = parsedEvent.args['projectId'];
                break; // Exit the loop once the event is found
            }
        } catch (error) {
            // This error is expected if a log doesn't match an event in our ABI
            // We can safely ignore it and continue to the next log
        }
    }

    if (projectId === null) {
        throw new Error("ProjectCreated event not found in transaction logs.");
    }

    console.log("--- Project Creation Successful! ---");
    console.log(`Retrieved Project ID from event: ${projectId.toString()}`);

    return projectId.toString();
  }
}
