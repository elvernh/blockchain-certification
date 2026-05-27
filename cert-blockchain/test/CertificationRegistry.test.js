const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificationRegistry", function () {
  let registry, owner, issuer, holder, other;

  beforeEach(async function () {
    [owner, issuer, holder, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CertificationRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();

    await registry.connect(owner).addIssuer(issuer.address);
  });

  describe("Issuer management", function () {
    it("owner can add an issuer", async function () {
      expect(await registry.isIssuer(issuer.address)).to.be.true;
    });

    it("non-owner cannot add an issuer", async function () {
      await expect(registry.connect(other).addIssuer(other.address))
        .to.be.revertedWith("Not owner");
    });

    it("owner can remove an issuer", async function () {
      await registry.connect(owner).removeIssuer(issuer.address);
      expect(await registry.isIssuer(issuer.address)).to.be.false;
    });
  });

  describe("issueCertificate", function () {
    let certId, expiry, metaHash;

    beforeEach(function () {
      certId = ethers.id("cert-001");
      expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      metaHash = ethers.id("metadata");
    });

    it("issuer can issue a certificate", async function () {
      await expect(
        registry.connect(issuer).issueCertificate(certId, holder.address, "Blockchain Dev", expiry, metaHash)
      ).to.emit(registry, "CertificateIssued").withArgs(certId, holder.address, issuer.address, expiry);
    });

    it("non-issuer cannot issue", async function () {
      await expect(
        registry.connect(other).issueCertificate(certId, holder.address, "Test", expiry, metaHash)
      ).to.be.revertedWith("Not a registered issuer");
    });

    it("cannot issue duplicate cert ID", async function () {
      await registry.connect(issuer).issueCertificate(certId, holder.address, "Test", expiry, metaHash);
      await expect(
        registry.connect(issuer).issueCertificate(certId, holder.address, "Test2", expiry, metaHash)
      ).to.be.revertedWith("Certificate ID already exists");
    });
  });

  describe("verifyCertificate", function () {
    let certId, expiry, metaHash;

    beforeEach(async function () {
      certId = ethers.id("cert-002");
      expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      metaHash = ethers.id("metadata");
      await registry.connect(issuer).issueCertificate(certId, holder.address, "Test Cert", expiry, metaHash);
    });

    it("returns VALID for a live certificate", async function () {
      const [, status] = await registry.verifyCertificate(certId);
      expect(status).to.equal(0); // CertStatus.VALID
    });

    it("returns REVOKED after revocation", async function () {
      await registry.connect(issuer).revokeCertificate(certId, "fraud");
      const [, status] = await registry.verifyCertificate(certId);
      expect(status).to.equal(1); // CertStatus.REVOKED
    });
  });

  describe("transferCertificate", function () {
    let certId;

    beforeEach(async function () {
      certId = ethers.id("cert-003");
      const expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      await registry.connect(issuer).issueCertificate(certId, holder.address, "Test", expiry, ethers.id("meta"));
    });

    it("holder can transfer their certificate", async function () {
      await expect(registry.connect(holder).transferCertificate(certId, other.address))
        .to.emit(registry, "OwnershipTransferred_Cert")
        .withArgs(certId, holder.address, other.address);
    });

    it("non-holder cannot transfer", async function () {
      await expect(registry.connect(other).transferCertificate(certId, other.address))
        .to.be.revertedWith("Not certificate holder");
    });
  });
});
