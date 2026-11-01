// Computes the SHA-256 hash of alu-logo.png and returns it as a 0x-prefixed bytes32.
// Run directly to print it:  node scripts/hashLogo.js [path/to/file]
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_LOGO = path.join(__dirname, "..", "alu-logo.png");

function hashFile(filePath = DEFAULT_LOGO) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Logo file not found: ${filePath}. Place the official ALU logo at alu-logo.png`);
  }
  const hex = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  return "0x" + hex;
}

module.exports = { hashFile, DEFAULT_LOGO };

if (require.main === module) {
  const file = process.argv[2] || DEFAULT_LOGO;
  const hash = hashFile(file);
  console.log(`File:    ${file}`);
  console.log(`SHA-256: ${hash.slice(2)}`);
  console.log(`bytes32: ${hash}`);
}
