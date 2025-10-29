// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/* TODO: What is next presentation.
  Robust Escrow for Freelance Work
  - Supports HBAR (native) and ERC20/HTS-like tokens (optional tokenAddress)
  - Pull-payment pattern (withdraw) to avoid forced transfers
  - ReentrancyGuard to prevent reentrancy attacks
  - Events for off-chain indexing
  - Delivery / Approval / Refund / Dispute flow with arbitrator resolution
  - Designed for EVM-compatible Hedera (works with Hedera's EVM) 
*/

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustDealEscrow is ReentrancyGuard, Ownable {
    // Data Types
    enum State { NONE, FUNDED, DELIVERED, APPROVED, REFUNDED }

    struct Project {
        address client;
        address freelancer;
        uint256 amount;       // in tinybars
        string previewHash;
        string finalHash;
        uint256 deliveryDeadline;   // unix timestamp
        uint256 approvalDeadline;   // unix timestamp after delivery
        uint256 approvalWindowSeconds;   // unix timestamp
        State state;
        uint256 payout;             // amount reserved for freelancer (pull)
    }

    // State Variables
    mapping(uint256 => Project) public projects;
    uint256 public projectCount;

    // Events
    event ProjectCreated(uint256 indexed projectId, address indexed client, address indexed freelancer, uint256 amount);
    event WorkDelivered(uint256 indexed projectId, string previewHash);
    event WorkApproved(uint256 indexed projectId);
    event RefundIssued(uint256 indexed projectId);
    event Withdrawn(uint256 indexed projectId, address indexed to, uint256 amount);
    event AutoRefunded(uint256 indexed projectId);
    event AutoApproved(uint256 indexed projectId);

    // Modifiers
    modifier onlyClient(uint256 _projectId) {
        require(msg.sender == projects[_projectId].client, "Not client");
        _;
    }

    modifier onlyFreelancer(uint256 _projectId) {
        require(msg.sender == projects[_projectId].freelancer, "Not freelancer");
        _;
    }

    modifier inState(uint256 _projectId, State _state) {
        require(projects[_projectId].state == _state, "Invalid state");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * Create project paying native HBAR.
     * msg.value must equal amount in native units (tinybars-equivalent in Hedera).
     */
    function createProjectHBAR(address _freelancer, uint256 _approvalWindowSeconds, uint256 _deliveryDeadlineSeconds) external payable returns (uint256) {
        require(_freelancer != address(0), "Invalid freelancer");
        require(msg.value > 0, "Must send funds");
        require(_deliveryDeadlineSeconds >= 1 days, "Delivery deadline too short");
        require(_approvalWindowSeconds >= 1 days, "Approval window too short");
        require(_approvalWindowSeconds <= 30 days, "Approval window too long");

        projectCount++;
        uint256 pid = projectCount;

        projects[pid] = Project({
            client: msg.sender,
            freelancer: _freelancer,
            amount: msg.value,
            previewHash: "",
            finalHash: "",
            deliveryDeadline: block.timestamp + _deliveryDeadlineSeconds,
            approvalDeadline: 0, // set after delivery
            approvalWindowSeconds: _approvalWindowSeconds,
            state: State.FUNDED,
            payout: 0
        });

        emit ProjectCreated(pid, msg.sender, _freelancer, msg.value);
        return pid;
    }

    /**
     * Freelancer delivers a preview (set previewHash). Must be called by freelancer.
     * Sets delivered state and computes approval deadline.
     */
    function deliverWork(uint256 _projectId, string calldata _previewHash) external onlyFreelancer(_projectId) inState(_projectId, State.FUNDED) {
        Project storage p = projects[_projectId];
        require(block.timestamp <= p.deliveryDeadline, "Delivery deadline passed");

        p.previewHash = _previewHash;
        p.state = State.DELIVERED;
        p.approvalDeadline = block.timestamp + p.approvalWindowSeconds;

        emit WorkDelivered(_projectId, _previewHash);
    }

    /**
     * Client approves delivered work -> marks approved and credits payout for freelancer.
     * Uses pull pattern: freelancer must call withdraw to pull funds.
     */
    function approveWork(uint256 _projectId) external onlyClient(_projectId) inState(_projectId, State.DELIVERED) {
        Project storage p = projects[_projectId];
        p.state = State.APPROVED;
        p.payout = p.amount; // entire escrow is reserved to freelancer
        emit WorkApproved(_projectId);
    }

    /**
     * Client requests refund before delivery or when allowed.
     * Only allowed when project is still FUNDED (not delivered) or in certain other states.
     */
    function requestRefund(uint256 _projectId) external onlyClient(_projectId) inState(_projectId, State.FUNDED) nonReentrant {
        Project storage p = projects[_projectId];
        p.state = State.REFUNDED;

        // send HBAR back to client using call (safe)
        (bool ok,) = payable(p.client).call{value: p.amount}("");
        require(ok, "HBAR refund failed");

        emit RefundIssued(_projectId);
    }

    /**
     * Freelancer withdraws available payout (pull pattern), protected by reentrancy guard.
     */
    function withdraw(uint256 _projectId) external nonReentrant {
        Project storage p = projects[_projectId];
        require(msg.sender == p.freelancer, "Not freelancer");
        uint256 amount = p.payout;
        require(amount > 0, "Nothing to withdraw");
        p.payout = 0;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "HBAR send failed");

        emit Withdrawn(_projectId, msg.sender, amount);
    }

    // --- AUTOMATIC DEADLINE HANDLERS ---

    // Anyone can call this to trigger refund if freelancer missed delivery deadline
    function autoRefundIfLate(uint256 _projectId) external nonReentrant {
        Project storage p = projects[_projectId];
        require(p.state == State.FUNDED, "Not in funded state");
        require(block.timestamp > p.deliveryDeadline, "Delivery deadline not passed");

        p.state = State.REFUNDED;
        (bool ok, ) = payable(p.client).call{value: p.amount}("");
        require(ok, "HBAR send failed");
        emit AutoRefunded(_projectId);
    }

    // Anyone can call this to auto-approve payment if client missed approval deadline
    function autoApproveIfClientSilent(uint256 _projectId) external {
        Project storage p = projects[_projectId];
        require(p.state == State.DELIVERED, "Not delivered");
        require(block.timestamp > p.approvalDeadline, "Approval deadline not passed");

        p.state = State.APPROVED;
        p.payout = p.amount;
        emit AutoApproved(_projectId);
    }


    /** View helper: get project details (auto-generated getter exists but this is explicit) */
    function getProject(uint256 _projectId) external view returns (Project memory) {
        return projects[_projectId];
    }

    // receive and fallback to accept native HBAR (useful for Hedera)
    receive() external payable {}
    fallback() external payable {}
}

