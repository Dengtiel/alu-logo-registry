require("@nomicfoundation/hardhat-toolbox");

// Optional Sepolia testnet settings, read from environment variables:
//   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<key>
//   PRIVATE_KEY=<test wallet private key, never a real-funds wallet>
const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" },
  },
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    ...(SEPOLIA_RPC_URL && PRIVATE_KEY
      ? { sepolia: { url: SEPOLIA_RPC_URL, accounts: [PRIVATE_KEY] } }
      : {}),
  },
};
