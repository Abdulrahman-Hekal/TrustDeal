const fs = require("node:fs");
const path = require("node:path");
const solc = require("solc");

// Path to your Solidity file
const fileName = "TrustDealEscrow.sol";
const source = fs.readFileSync(path.join(__dirname, fileName), "utf8");

// Custom import resolver
function findImports(importPath) {
  try {
    // Handle OpenZeppelin imports
    if (importPath.startsWith("@openzeppelin/")) {
      const openZeppelinPath = path.resolve(
        "node_modules",
        importPath
      );
      const content = fs.readFileSync(openZeppelinPath, "utf8");
      return { contents: content };
    }

    // Local imports
    const fullPath = path.resolve(importPath);
    const content = fs.readFileSync(fullPath, "utf8");
    return { contents: content };
  } catch (e) {
    return { error: `File not found: ${importPath}` };
  }
}

const input = {
  language: "Solidity",
  sources: {
    [fileName]: { content: source },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"],
      },
    },
  },
};

// Compile with resolver
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (output.errors) {
  for (const err of output.errors) {
    console.log(err.formattedMessage);
  }
}

// Extract contract dynamically
const fileContracts = output.contracts[fileName];
const contractName = Object.keys(fileContracts)[0];
const contract = fileContracts[contractName];

// Write output JSON (for Hedera deployment)
fs.writeFileSync(`${path.join(__dirname, contractName)}.json`, JSON.stringify(contract, null, 2));

console.log(`✅ Compiled successfully: ${contractName}`);
