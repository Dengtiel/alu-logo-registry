# ALU Logo Registry & Tokenisation

This project protects the official African Leadership University (ALU) logo on the Ethereum blockchain using two smart contracts. **ALUAssetRegistry** (ERC-721) registers the logo as a unique NFT. The NFT stores the SHA-256 fingerprint of the logo file, the registering wallet and the registration time. Anyone can then check whether a copy of the logo is authentic or modified. **ALULogoToken** (ERC-20, symbol ALUT) tokenises ownership of the registered logo. It mints a fixed 1,000,000 shares to the logo owner, who can distribute them to stakeholders such as faculty, students and administration. The NFT proves what the asset is and who registered it, and the ERC-20 token represents who holds shares in it.

## Registered logo hash (SHA-256)

```
e19d2fd8fa7a2af3d69b50da15cf0250cc7e55a48fd5432cc4c3de2c17a97396
```

To verify independently, run `sha256sum alu-logo.png` (Linux), `shasum -a 256 alu-logo.png` (macOS) or `Get-FileHash alu-logo.png` (Windows PowerShell), and compare the result with the hash above.

## Project structure

| Path | Purpose |
| --- | --- |
| `contracts/ALUAssetRegistry.sol` | ERC-721 registry: `registerAsset`, `verifyLogoIntegrity`, `getAsset` |
| `contracts/ALULogoToken.sol` | ERC-20 share token: `distributeShares`, `ownershipPercentage` |
| `scripts/hashLogo.js` | Computes the SHA-256 hash of `alu-logo.png` |
| `scripts/deploy.js` | Deploys the registry, registers the logo, then deploys the token |
| `test/ALUAssetRegistry.test.js` | The eight automated tests |
| `alu-logo.png` | The official ALU logo that was hashed and registered |

## Versions

- Solidity: 0.8.24 (EVM target: cancun, optimizer enabled with 200 runs)
- Hardhat: 2.29.1
- OpenZeppelin Contracts: 5.6.1
- Node.js: 22.14.0

## Setup and usage

1. Install dependencies: `npm install`
2. Print the logo hash: `npm run hash`
3. Compile the contracts: `npm run compile`
4. Run the tests (8 should pass): `npm test`
5. Start a local blockchain in terminal 1: `npm run node`
6. Deploy in terminal 2: `npm run deploy:local`
7. Optional Sepolia deployment: set the `SEPOLIA_RPC_URL` and `PRIVATE_KEY` environment variables (use a test-only wallet), then run `npm run deploy:sepolia`

## Deployed contracts (Sepolia)

Both contracts were deployed from Remix IDE through MetaMask by `0xb47Cc6142979e5d781e6A0A7c71506a7D8A52AB8`.

- ALUAssetRegistry: [`0xef6d96af39F3e8e60a9838fed803dfFaDf2aEF39`](https://sepolia.etherscan.io/address/0xef6d96af39F3e8e60a9838fed803dfFaDf2aEF39). The ALU logo is registered as token #1, and `verifyLogoIntegrity(1, <hash above>)` returns `true, "Logo is authentic."`
- ALULogoToken: [`0x090730150D06680D414DF6B5251cB2468b4Fd04F`](https://sepolia.etherscan.io/address/0x090730150D06680D414DF6B5251cB2468b4Fd04F). The full 1,000,000 ALUT supply is held by the deployer.

## Problems encountered and how they were resolved

- `npm install` failed once with `ECONNRESET` (a dropped network connection). Re-running it with `--fetch-retries=5` completed the install.
- `npx hardhat` without a local install pulls Hardhat 3, which uses a different config format. Installing `hardhat@^2.22.0` as a dev dependency pins the project to Hardhat 2.
- Deploying twice to the same node fails with "asset already registered". This is the intended duplicate protection, and restarting `npx hardhat node` gives a fresh chain.
- The downloaded logo was a WebP image saved with a `.png` name, so the file did not match the `image/png` type recorded on-chain. It was converted to a real PNG (500 × 188) and renamed `alu-logo.png`, and the hash above was taken from that file.
- On Sepolia, MetaMask estimated a 0.0127 ETH fee for deploying ALULogoToken, which was more than the wallet held, so it blocked the transaction. Topping up from a faucet fixed it.
- Remix switched its environment back to "Remix VM", so one token deployment went to Remix's in-browser chain instead of Sepolia. Checking that the environment badge said "Sepolia (11155111)" and that a MetaMask confirmation appeared before deploying avoided this.
- Remix's Etherscan verification was skipped because no API key was set, and Blockscout's first check ran before the token contract was indexed. Both contracts are verified as exact matches on Sourcify.
