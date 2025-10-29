const { ContractCreateFlow } = require("@hashgraph/sdk");
const hedera = require("../utils/hedera.utils");
const fs = require("node:fs");
const path = require("node:path");

// Load compiled contract
const compiledContract = JSON.parse(
  fs.readFileSync(path.join(__dirname, "TrustDealEscrow.json"), "utf8")
);

// Deploy contract
hedera(async (client) => {
  const bytecode = compiledContract.evm.bytecode.object;

  const contractCreateFlow = new ContractCreateFlow()
    .setGas(5000000)
    .setBytecode(bytecode); //Fill in the bytecode

  //Sign the transaction with the client operator key and submit to a Hedera network
  const txContractCreateFlowResponse = await contractCreateFlow.execute(client);

  //Get the receipt of the transaction
  const receiptContractCreateFlow =
    await txContractCreateFlowResponse.getReceipt(client);

  //Get the status of the transaction
  const statusContractCreateFlow = receiptContractCreateFlow.status;

  //Get the Transaction ID
  const txContractCreateId =
    txContractCreateFlowResponse.transactionId.toString();

  //Get the new contract ID
  const contractId = receiptContractCreateFlow.contractId;

  console.log(
    "--------------------------------- Create Contract Flow ---------------------------------"
  );
  console.log(
    "Consensus status           :",
    statusContractCreateFlow.toString()
  );
  console.log("Transaction ID             :", txContractCreateId);
  console.log(
    "Hashscan URL               :",
    "https://hashscan.io/testnet/transaction/" + txContractCreateId
  );
  console.log(
    "Contract ID                :",
    contractId.toStringWithChecksum(client)
  );
});
