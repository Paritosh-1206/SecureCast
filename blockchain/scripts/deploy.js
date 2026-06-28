// scripts/deploy.js
// Deploys a new Election contract to the configured network.
// Usage: npx hardhat run scripts/deploy.js --network localhost

const hre = require("hardhat");

async function main() {
  const title = process.env.ELECTION_TITLE || "Demo Election";
  const candidateCount = parseInt(process.env.CANDIDATE_COUNT || "3", 10);

  console.log(`\n🗳️  Deploying Election Contract...`);
  console.log(`   Title: ${title}`);
  console.log(`   Candidates: ${candidateCount}`);

  const Election = await hre.ethers.getContractFactory("Election");
  const election = await Election.deploy(title, candidateCount);
  await election.waitForDeployment();

  const address = await election.getAddress();
  console.log(`\n✅ Election contract deployed at: ${address}`);
  console.log(`   Network: ${hre.network.name}`);
  console.log(`   Admin: ${(await hre.ethers.getSigners())[0].address}\n`);

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
