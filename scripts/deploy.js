// Deploys ALUAssetRegistry, registers the real ALU logo, then deploys ALULogoToken.
// Usage: npx hardhat run scripts/deploy.js --network localhost
const hre = require("hardhat");
const { hashFile } = require("./hashLogo");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Network:  ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  // 1. Hash the actual logo file.
  const logoHash = hashFile();
  console.log(`ALU logo SHA-256: ${logoHash}`);

  // 2. Deploy the ERC-721 registry.
  const registry = await hre.ethers.deployContract("ALUAssetRegistry");
  await registry.waitForDeployment();
  console.log(`ALUAssetRegistry deployed to: ${await registry.getAddress()}`);

  // 3. Register the logo as part of deployment.
  const tx = await registry.registerAsset("ALU Official Logo", "image/png", logoHash);
  const receipt = await tx.wait();
  const event = receipt.logs
    .map((log) => { try { return registry.interface.parseLog(log); } catch { return null; } })
    .find((e) => e && e.name === "AssetRegistered");
  const tokenId = event.args.tokenId;
  console.log(`ALU logo registered as token #${tokenId} (tx ${receipt.hash})`);

  const [ok, msg] = await registry.verifyLogoIntegrity(tokenId, logoHash);
  console.log(`Integrity check: ${ok} - ${msg}`);

  // 4. Deploy the ERC-20 share token, full supply minted to the deployer.
  const token = await hre.ethers.deployContract("ALULogoToken", [deployer.address]);
  await token.waitForDeployment();
  const balance = await token.balanceOf(deployer.address);
  console.log(`ALULogoToken deployed to: ${await token.getAddress()}`);
  console.log(`Deployer balance: ${hre.ethers.formatUnits(balance, 18)} ALUT`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
