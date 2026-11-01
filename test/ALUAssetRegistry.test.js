const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { hashFile } = require("../scripts/hashLogo");

// SHA-256 of the real alu-logo.png in the project root.
const LOGO_HASH = hashFile();
const LOGO_NAME = "ALU Official Logo";
const LOGO_TYPE = "image/png";
const units = (n) => ethers.parseUnits(n.toString(), 18);

describe("ALUAssetRegistry", function () {
  async function deployRegistry() {
    const [owner, other] = await ethers.getSigners();
    const registry = await ethers.deployContract("ALUAssetRegistry");
    return { registry, owner, other };
  }

  async function deployAndRegister() {
    const ctx = await deployRegistry();
    await ctx.registry.registerAsset(LOGO_NAME, LOGO_TYPE, LOGO_HASH);
    return { ...ctx, tokenId: 1n };
  }

  it("1. registers the ALU logo successfully and returns a token ID", async function () {
    const { registry, owner } = await loadFixture(deployRegistry);
    const tokenId = await registry.registerAsset.staticCall(LOGO_NAME, LOGO_TYPE, LOGO_HASH);
    expect(tokenId).to.equal(1n);

    await expect(registry.registerAsset(LOGO_NAME, LOGO_TYPE, LOGO_HASH))
      .to.emit(registry, "AssetRegistered")
      .withArgs(1n, owner.address, LOGO_HASH, LOGO_NAME, LOGO_TYPE, (t) => t > 0n);
    expect(await registry.ownerOf(1n)).to.equal(owner.address);
  });

  it("2. rejects a second registration of the same hash", async function () {
    const { registry, other } = await loadFixture(deployAndRegister);
    await expect(
      registry.connect(other).registerAsset("Fake ALU Logo", LOGO_TYPE, LOGO_HASH)
    ).to.be.revertedWith("ALUAssetRegistry: asset already registered");
  });

  it("3. verifyLogoIntegrity() returns true for the correct hash", async function () {
    const { registry, tokenId } = await loadFixture(deployAndRegister);
    const [ok, msg] = await registry.verifyLogoIntegrity(tokenId, LOGO_HASH);
    expect(ok).to.equal(true);
    expect(msg).to.equal("Logo is authentic.");
  });

  it("4. verifyLogoIntegrity() returns false for an incorrect hash", async function () {
    const { registry, tokenId } = await loadFixture(deployAndRegister);
    const tampered = ethers.sha256(ethers.toUtf8Bytes("modified logo"));
    const [ok, msg] = await registry.verifyLogoIntegrity(tokenId, tampered);
    expect(ok).to.equal(false);
    expect(msg).to.equal("Warning: logo does not match.");
  });

  it("5. getAsset() returns the correct name and file type", async function () {
    const { registry, owner, tokenId } = await loadFixture(deployAndRegister);
    const asset = await registry.getAsset(tokenId);
    expect(asset.name).to.equal(LOGO_NAME);
    expect(asset.fileType).to.equal(LOGO_TYPE);
    expect(asset.contentHash).to.equal(LOGO_HASH);
    expect(asset.registeredBy).to.equal(owner.address);
  });
});

describe("ALULogoToken", function () {
  async function deployToken() {
    const [logoOwner, faculty, student] = await ethers.getSigners();
    const token = await ethers.deployContract("ALULogoToken", [logoOwner.address]);
    return { token, logoOwner, faculty, student };
  }

  it("6. mints the full 1,000,000 ALUT supply to the logo owner", async function () {
    const { token, logoOwner } = await loadFixture(deployToken);
    expect(await token.name()).to.equal("ALU Logo Token");
    expect(await token.symbol()).to.equal("ALUT");
    expect(await token.totalSupply()).to.equal(units(1_000_000));
    expect(await token.balanceOf(logoOwner.address)).to.equal(units(1_000_000));
  });

  it("7. distributeShares() transfers tokens to a recipient", async function () {
    const { token, logoOwner, faculty, student } = await loadFixture(deployToken);
    await expect(token.distributeShares(faculty.address, units(100_000)))
      .to.emit(token, "SharesDistributed").withArgs(faculty.address, units(100_000));
    expect(await token.balanceOf(faculty.address)).to.equal(units(100_000));
    expect(await token.balanceOf(logoOwner.address)).to.equal(units(900_000));

    // Only the owner may distribute, and zero amounts are rejected.
    await expect(token.connect(student).distributeShares(student.address, units(1)))
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    await expect(token.distributeShares(faculty.address, 0))
      .to.be.revertedWith("ALULogoToken: amount must be greater than zero");
  });

  it("8. ownershipPercentage() returns the correct percentage", async function () {
    const { token, logoOwner, faculty } = await loadFixture(deployToken);
    await token.distributeShares(faculty.address, units(500_000));
    expect(await token.ownershipPercentage(faculty.address)).to.equal(50n);
    expect(await token.ownershipPercentage(logoOwner.address)).to.equal(50n);
  });
});
