const { PinataSDK } = require("pinata");

module.exports = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "amber-impressive-galliform-239.mypinata.cloud",
});
