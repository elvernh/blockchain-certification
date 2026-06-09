/**
 * setup.js – Deploy (if needed) and register the default issuer.
 * Run with:  npx hardhat run scripts/setup.js --network localhost
 */
const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  console.log("Owner:", owner.address);

  const Registry = await hre.ethers.getContractFactory("CertificationRegistry");
  const addr = require("../ignition/deployments/chain-31337/deployed_addresses.json")[
    "CertificationRegistryModule#CertificationRegistry"
  ];
  const contract = Registry.attach(addr);

  const already = await contract.isIssuer(owner.address);
  if (already) {
    console.log("Already an issuer — nothing to do.");
  } else {
    const tx = await contract.addIssuer(owner.address, "CertChain Authority", "CertChain Platform");
    await tx.wait();
    console.log("Registered as issuer:", owner.address);
  }

  const info = await contract.getIssuerInfo(owner.address);
  console.log("Issuer info:", { name: info.name, org: info.organization, active: info.active });

  const [certs, issuers, paused] = await contract.getContractStats();
  console.log("Contract stats:", { certs: certs.toString(), issuers: issuers.toString(), paused });
}

main().catch(console.error);
