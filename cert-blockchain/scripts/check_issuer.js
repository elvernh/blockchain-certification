const hre = require("hardhat");
async function main() {
  const [owner] = await hre.ethers.getSigners();
  const Registry = await hre.ethers.getContractFactory("CertificationRegistry");
  const contract = Registry.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const isIssuer = await contract.isIssuer(owner.address);
  console.log("Account #0:", owner.address);
  console.log("isIssuer:", isIssuer);
}
main().catch(console.error);
