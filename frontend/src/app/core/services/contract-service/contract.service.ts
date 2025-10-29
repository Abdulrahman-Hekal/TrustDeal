import { inject, Injectable, signal } from '@angular/core';
import { ethers } from 'ethers';
import contractJson from '../../contract/TrustDealEscrow.json';
import { WalletService } from '../wallet-service/wallet.service';

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
  private provider!: ethers.BrowserProvider;
  private signer!: ethers.Signer;
  private contract!: ethers.Contract;

  private readonly contractAddress = '0x00000000000000000000000000000000006d358b';
  private readonly contractABI = contractJson.abi;

  events = signal<ProjectEvent[]>([]);

  async initContract(): Promise<void> {
    if (!this._walletService.isConnected()) {
      throw new Error('Wallet not connected. Please connect via WalletService.');
    }

    // Hedera WalletConnect injects `ethereum` compatible provider
    const anyWindow = globalThis as any;
    if (!anyWindow.ethereum) {
      throw new Error('No EVM provider found. Ensure HashPack or Blade Wallet is open.');
    }

    this.provider = new ethers.BrowserProvider(anyWindow.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.signer);
    this.listenToEvents();
  }

  /* Create a new escrow project */
  async createProjectHBAR(
    freelancer: string,
    approvalWindowSec: number,
    deliveryDeadlineSec: number,
    amountHBAR: string
  ) {
    await this.ensureContract();
    const value = ethers.parseEther(amountHBAR);
    const tx = await this.contract['createProjectHBAR'](
      freelancer,
      approvalWindowSec,
      deliveryDeadlineSec,
      { value }
    );
    return await tx.wait();
  }

  /* Freelancer delivers work */
  async deliverWork(projectId: number, previewHash: string) {
    await this.ensureContract();
    const tx = await this.contract['deliverWork'](projectId, previewHash);
    return await tx.wait();
  }

  /* Client approves delivered work */
  async approveWork(projectId: number) {
    await this.ensureContract();
    const tx = await this.contract['approveWork'](projectId);
    return await tx.wait();
  }

  /* Client requests refund */
  async requestRefund(projectId: number) {
    await this.ensureContract();
    const tx = await this.contract['requestRefund'](projectId);
    return await tx.wait();
  }

  /* Freelancer withdraws payout */
  async withdraw(projectId: number) {
    await this.ensureContract();
    const tx = await this.contract['withdraw'](projectId);
    return await tx.wait();
  }

  /* Auto refund if freelancer missed deadline */
  async autoRefundIfLate(projectId: number) {
    await this.ensureContract();
    const tx = await this.contract['autoRefundIfLate'](projectId);
    return await tx.wait();
  }

  /* Auto approve if client didn’t respond */
  async autoApproveIfClientSilent(projectId: number) {
    await this.ensureContract();
    const tx = await this.contract['autoApproveIfClientSilent'](projectId);
    return await tx.wait();
  }

  /* Read project info */
  async getProject(projectId: number) {
    await this.ensureContract();
    return await this.contract['getProject'](projectId);
  }

  /* Get balance */
  async getBalance(): Promise<string> {
    await this.ensureContract();
    const address = await this.signer.getAddress();
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /************* Helpers *************/

  /** 🧩 Ensure contract is initialized */
  private async ensureContract(): Promise<void> {
    if (!this.contract) {
      await this.initContract();
    }
  }

  private listenToEvents() {
    if (!this.contract) return;

    const addEvent = (name: string, projectId: number, data?: any, txHash?: string) => {
      const event: ProjectEvent = {
        name,
        projectId,
        data,
        txHash,
        timestamp: Date.now(),
      };
      this.events.update((prev) => [event, ...prev]); // prepend new event
    };

    this.contract.on('ProjectCreated', (projectId, client, freelancer, amount, event) => {
      addEvent(
        'ProjectCreated',
        Number(projectId),
        { client, freelancer, amount },
        event.log.transactionHash
      );
    });

    this.contract.on('WorkDelivered', (projectId, previewHash, event) => {
      addEvent('WorkDelivered', Number(projectId), { previewHash }, event.log.transactionHash);
    });

    this.contract.on('WorkApproved', (projectId, event) => {
      addEvent('WorkApproved', Number(projectId), {}, event.log.transactionHash);
    });

    this.contract.on('RefundIssued', (projectId, event) => {
      addEvent('RefundIssued', Number(projectId), {}, event.log.transactionHash);
    });

    this.contract.on('Withdrawn', (projectId, to, amount, event) => {
      addEvent('Withdrawn', Number(projectId), { to, amount }, event.log.transactionHash);
    });

    this.contract.on('AutoRefunded', (projectId, event) => {
      addEvent('AutoRefunded', Number(projectId), {}, event.log.transactionHash);
    });

    this.contract.on('AutoApproved', (projectId, event) => {
      addEvent('AutoApproved', Number(projectId), {}, event.log.transactionHash);
    });
  }
}
