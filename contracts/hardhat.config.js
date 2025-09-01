require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const HEDERA_RPC_URL = process.env.HEDERA_RPC_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.21",
  defaultNetwork: "testnet",
  networks: {
    testnet: {
      url: HEDERA_RPC_URL
    }
  }
};


