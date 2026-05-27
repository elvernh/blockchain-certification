const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CertificationRegistryModule", (m) => {
  const registry = m.contract("CertificationRegistry");
  return { registry };
});