const { AccountId, PrivateKey, Client } = require("@hashgraph/sdk");
const logger = require("./logger.utils");
require("dotenv").config();

async function main(cb) {
  let client;
  try {
    // Your account ID and private key from string value
    const MY_ACCOUNT_ID = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
    const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(
      process.env.HEDERA_PRIVATE_KEY
    );

    // Pre-configured client for testnet
    client = Client.forTestnet();

    //Set the operator with the account ID and private key
    client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

    // Start your code here
    await cb(client);

  } catch (error) {
    logger.error(`Error in hedera utility: ${error.message}`);
  } finally {
    if (client) client.close();
  }
}

module.exports = main;
