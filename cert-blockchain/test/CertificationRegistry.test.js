const { expect } = require("chai");
const { ethers }  = require("hardhat");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ONE_YEAR  = 365 * 24 * 60 * 60;
const futureExp = () => Math.floor(Date.now() / 1000) + ONE_YEAR;

// ─── Suite ────────────────────────────────────────────────────────────────────

describe("CertificationRegistry", function () {
  let registry, owner, issuer, issuer2, holder, other;

  beforeEach(async function () {
    [owner, issuer, issuer2, holder, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificationRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
    // Register the primary issuer for all test suites
    await registry.connect(owner).addIssuer(issuer.address, "Acme University", "Faculty of Engineering");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  Deployment
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("starts unpaused", async function () {
      expect(await registry.paused()).to.be.false;
    });

    it("initialises with zero certificates and zero issuers", async function () {
      const Factory2 = await ethers.getContractFactory("CertificationRegistry");
      const fresh    = await Factory2.deploy();
      await fresh.waitForDeployment();
      const [certs, issuers] = await fresh.getContractStats();
      expect(certs).to.equal(0);
      expect(issuers).to.equal(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  Issuer management – addIssuer
  // ═══════════════════════════════════════════════════════════════════════════
  describe("addIssuer", function () {
    it("owner can add a new issuer", async function () {
      expect(await registry.isIssuer(issuer.address)).to.be.true;
    });

    it("emits IssuerAdded and IssuerMetadataSet", async function () {
      await expect(
        registry.connect(owner).addIssuer(issuer2.address, "Beta College", "Sciences")
      )
        .to.emit(registry, "IssuerAdded").withArgs(issuer2.address, owner.address)
        .and.to.emit(registry, "IssuerMetadataSet").withArgs(issuer2.address, "Beta College", "Sciences");
    });

    it("stores issuer name and organisation", async function () {
      const info = await registry.getIssuerInfo(issuer.address);
      expect(info.name).to.equal("Acme University");
      expect(info.organization).to.equal("Faculty of Engineering");
      expect(info.active).to.be.true;
    });

    it("increments totalIssuers", async function () {
      const [, total] = await registry.getContractStats();
      expect(total).to.equal(1);
    });

    it("reverts when called by non-owner", async function () {
      await expect(
        registry.connect(other).addIssuer(other.address, "X", "Y")
      ).to.be.revertedWith("Not owner");
    });

    it("reverts on zero address", async function () {
      await expect(
        registry.connect(owner).addIssuer(ethers.ZeroAddress, "X", "Y")
      ).to.be.revertedWith("Invalid address: zero address");
    });

    it("reverts when issuer is already active", async function () {
      await expect(
        registry.connect(owner).addIssuer(issuer.address, "Dup", "Dup")
      ).to.be.revertedWith("Already an active issuer");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  Issuer management – removeIssuer & setIssuerMetadata
  // ═══════════════════════════════════════════════════════════════════════════
  describe("removeIssuer", function () {
    it("owner can remove an issuer", async function () {
      await registry.connect(owner).removeIssuer(issuer.address);
      expect(await registry.isIssuer(issuer.address)).to.be.false;
    });

    it("emits IssuerRemoved event", async function () {
      await expect(registry.connect(owner).removeIssuer(issuer.address))
        .to.emit(registry, "IssuerRemoved").withArgs(issuer.address, owner.address);
    });

    it("decrements totalIssuers", async function () {
      await registry.connect(owner).removeIssuer(issuer.address);
      const [, total] = await registry.getContractStats();
      expect(total).to.equal(0);
    });

    it("reverts when address is not an issuer", async function () {
      await expect(registry.connect(owner).removeIssuer(other.address))
        .to.be.revertedWith("Not an active issuer");
    });

    it("removed issuer cannot issue certificates", async function () {
      await registry.connect(owner).removeIssuer(issuer.address);
      const certId = ethers.id("cert-removed");
      await expect(
        registry.connect(issuer).issueCertificate(certId, holder.address, "X", futureExp(), ethers.id("m"))
      ).to.be.revertedWith("Not an active issuer");
    });
  });

  describe("setIssuerMetadata", function () {
    it("owner can update an issuer's metadata", async function () {
      await registry.connect(owner).setIssuerMetadata(issuer.address, "New Name", "New Org");
      const info = await registry.getIssuerInfo(issuer.address);
      expect(info.name).to.equal("New Name");
      expect(info.organization).to.equal("New Org");
    });

    it("emits IssuerMetadataSet", async function () {
      await expect(registry.connect(owner).setIssuerMetadata(issuer.address, "N", "O"))
        .to.emit(registry, "IssuerMetadataSet").withArgs(issuer.address, "N", "O");
    });

    it("reverts when called by non-owner", async function () {
      await expect(registry.connect(other).setIssuerMetadata(issuer.address, "N", "O"))
        .to.be.revertedWith("Not owner");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  pauseContract / unpauseContract
  // ═══════════════════════════════════════════════════════════════════════════
  describe("pauseContract / unpauseContract", function () {
    it("owner can pause and unpause", async function () {
      await registry.connect(owner).pauseContract();
      expect(await registry.paused()).to.be.true;
      await registry.connect(owner).unpauseContract();
      expect(await registry.paused()).to.be.false;
    });

    it("emits ContractPaused and ContractUnpaused events", async function () {
      await expect(registry.connect(owner).pauseContract())
        .to.emit(registry, "ContractPaused").withArgs(owner.address);
      await expect(registry.connect(owner).unpauseContract())
        .to.emit(registry, "ContractUnpaused").withArgs(owner.address);
    });

    it("non-owner cannot pause", async function () {
      await expect(registry.connect(other).pauseContract())
        .to.be.revertedWith("Not owner");
    });

    it("issueCertificate is blocked when paused", async function () {
      await registry.connect(owner).pauseContract();
      const certId = ethers.id("cert-paused");
      await expect(
        registry.connect(issuer).issueCertificate(certId, holder.address, "X", futureExp(), ethers.id("m"))
      ).to.be.revertedWith("Contract is paused");
    });

    it("endorseCertificate is blocked when paused", async function () {
      const certId = ethers.id("cert-pause-endorse");
      await registry.connect(issuer).issueCertificate(certId, holder.address, "X", futureExp(), ethers.id("m"));
      await registry.connect(owner).pauseContract();
      await expect(registry.connect(other).endorseCertificate(certId))
        .to.be.revertedWith("Contract is paused");
    });

    it("reverts when pausing an already-paused contract", async function () {
      await registry.connect(owner).pauseContract();
      await expect(registry.connect(owner).pauseContract())
        .to.be.revertedWith("Already paused");
    });

    it("reverts when unpausing a non-paused contract", async function () {
      await expect(registry.connect(owner).unpauseContract())
        .to.be.revertedWith("Not currently paused");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  transferOwnership
  // ═══════════════════════════════════════════════════════════════════════════
  describe("transferOwnership", function () {
    it("owner can transfer ownership", async function () {
      await registry.connect(owner).transferOwnership(other.address);
      expect(await registry.owner()).to.equal(other.address);
    });

    it("emits OwnershipTransferred", async function () {
      await expect(registry.connect(owner).transferOwnership(other.address))
        .to.emit(registry, "OwnershipTransferred").withArgs(owner.address, other.address);
    });

    it("new owner gains admin privileges", async function () {
      await registry.connect(owner).transferOwnership(other.address);
      await expect(
        registry.connect(other).addIssuer(issuer2.address, "X", "Y")
      ).not.to.be.reverted;
    });

    it("previous owner loses admin privileges after transfer", async function () {
      await registry.connect(owner).transferOwnership(other.address);
      await expect(
        registry.connect(owner).addIssuer(issuer2.address, "X", "Y")
      ).to.be.revertedWith("Not owner");
    });

    it("reverts on zero-address transfer", async function () {
      await expect(registry.connect(owner).transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address: zero address");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  issueCertificate
  // ═══════════════════════════════════════════════════════════════════════════
  describe("issueCertificate", function () {
    let certId, expiry, metaHash;

    beforeEach(function () {
      certId   = ethers.id("cert-issue-001");
      expiry   = futureExp();
      metaHash = ethers.id("metadata");
    });

    it("active issuer can issue a certificate", async function () {
      await expect(
        registry.connect(issuer).issueCertificate(certId, holder.address, "BSc CS", expiry, metaHash)
      ).to.emit(registry, "CertificateIssued")
        .withArgs(certId, holder.address, issuer.address, "BSc CS", expiry);
    });

    it("increments totalCertificates and issuer's totalIssued counter", async function () {
      await registry.connect(issuer).issueCertificate(certId, holder.address, "X", expiry, metaHash);
      const [total] = await registry.getContractStats();
      expect(total).to.equal(1);
      const info = await registry.getIssuerInfo(issuer.address);
      expect(info.totalIssued).to.equal(1);
    });

    it("non-issuer cannot issue", async function () {
      await expect(
        registry.connect(other).issueCertificate(certId, holder.address, "X", expiry, metaHash)
      ).to.be.revertedWith("Not an active issuer");
    });

    it("reverts when expiry is in the past", async function () {
      const pastExpiry = Math.floor(Date.now() / 1000) - 1;
      await expect(
        registry.connect(issuer).issueCertificate(certId, holder.address, "X", pastExpiry, metaHash)
      ).to.be.revertedWith("Expiry must be in the future");
    });

    it("reverts on duplicate certificate ID", async function () {
      await registry.connect(issuer).issueCertificate(certId, holder.address, "X", expiry, metaHash);
      await expect(
        registry.connect(issuer).issueCertificate(certId, holder.address, "Y", expiry, metaHash)
      ).to.be.revertedWith("Certificate ID already exists");
    });

    it("reverts when holder is zero address", async function () {
      await expect(
        registry.connect(issuer).issueCertificate(certId, ethers.ZeroAddress, "X", expiry, metaHash)
      ).to.be.revertedWith("Invalid address: zero address");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  revokeCertificate
  // ═══════════════════════════════════════════════════════════════════════════
  describe("revokeCertificate", function () {
    let certId;

    beforeEach(async function () {
      certId = ethers.id("cert-revoke-001");
      await registry.connect(issuer).issueCertificate(certId, holder.address, "X", futureExp(), ethers.id("m"));
    });

    it("original issuer can revoke a certificate", async function () {
      await expect(registry.connect(issuer).revokeCertificate(certId, "Fraud detected"))
        .to.emit(registry, "CertificateRevoked").withArgs(certId, issuer.address, "Fraud detected");
    });

    it("verify returns REVOKED after revocation", async function () {
      await registry.connect(issuer).revokeCertificate(certId, "reason");
      const [, status] = await registry.verifyCertificate(certId);
      expect(status).to.equal(1); // CertStatus.REVOKED
    });

    it("a different issuer cannot revoke", async function () {
      await registry.connect(owner).addIssuer(issuer2.address, "X", "Y");
      await expect(registry.connect(issuer2).revokeCertificate(certId, "reason"))
        .to.be.revertedWith("Not the original issuer");
    });

    it("reverts on non-existent certificate", async function () {
      await expect(registry.connect(issuer).revokeCertificate(ethers.id("fake"), "r"))
        .to.be.revertedWith("Certificate not found");
    });

    it("reverts when revoking an already-revoked certificate", async function () {
      await registry.connect(issuer).revokeCertificate(certId, "first");
      await expect(registry.connect(issuer).revokeCertificate(certId, "second"))
        .to.be.revertedWith("Certificate already revoked");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  renewCertificate
  // ═══════════════════════════════════════════════════════════════════════════
  describe("renewCertificate", function () {
    let certId;

    beforeEach(async function () {
      certId = ethers.id("cert-renew-001");
      await registry.connect(issuer).issueCertificate(certId, holder.address, "X", futureExp(), ethers.id("m"));
    });

    it("original issuer can renew a certificate", async function () {
      const newExpiry = futureExp() + ONE_YEAR;
      await expect(registry.connect(issuer).renewCertificate(certId, newExpiry))
        .to.emit(registry, "CertificateRenewed").withArgs(certId, issuer.address, newExpiry);
    });

    it("a different issuer cannot renew", async function () {
      await registry.connect(owner).addIssuer(issuer2.address, "X", "Y");
      await expect(registry.connect(issuer2).renewCertificate(certId, futureExp() + ONE_YEAR))
        .to.be.revertedWith("Not the original issuer");
    });

    it("reverts with a past expiry", async function () {
      const past = Math.floor(Date.now() / 1000) - 1;
      await expect(registry.connect(issuer).renewCertificate(certId, past))
        .to.be.revertedWith("New expiry must be in the future");
    });

    it("reverts when certificate is revoked", async function () {
      await registry.connect(issuer).revokeCertificate(certId, "r");
      await expect(registry.connect(issuer).renewCertificate(certId, futureExp() + ONE_YEAR))
        .to.be.revertedWith("Certificate already revoked");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  transferCertificate
  // ═══════════════════════════════════════════════════════════════════════════
  describe("transferCertificate", function () {
    let certId;

    beforeEach(async function () {
      certId = ethers.id("cert-transfer-001");
      await registry.connect(issuer).issueCertificate(certId, holder.address, "X", futureExp(), ethers.id("m"));
    });

    it("holder can transfer their certificate to another address", async function () {
      await expect(registry.connect(holder).transferCertificate(certId, other.address))
        .to.emit(registry, "CertificateTransferred").withArgs(certId, holder.address, other.address);
    });

    it("new holder appears in getCertificatesByHolder", async function () {
      await registry.connect(holder).transferCertificate(certId, other.address);
      const certs = await registry.getCertificatesByHolder(other.address);
      expect(certs).to.include(certId);
    });

    it("non-holder cannot transfer", async function () {
      await expect(registry.connect(other).transferCertificate(certId, other.address))
        .to.be.revertedWith("Not certificate holder");
    });

    it("cannot transfer a revoked certificate", async function () {
      await registry.connect(issuer).revokeCertificate(certId, "r");
      await expect(registry.connect(holder).transferCertificate(certId, other.address))
        .to.be.revertedWith("Certificate already revoked");
    });

    it("reverts on zero-address recipient", async function () {
      await expect(registry.connect(holder).transferCertificate(certId, ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address: zero address");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  endorseCertificate / revokeEndorsement
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Endorsements", function () {
    let certId;

    beforeEach(async function () {
      certId = ethers.id("cert-endorse-001");
      await registry.connect(issuer).issueCertificate(certId, holder.address, "X", futureExp(), ethers.id("m"));
    });

    it("any address (not the holder) can endorse", async function () {
      await expect(registry.connect(other).endorseCertificate(certId))
        .to.emit(registry, "CertificateEndorsed").withArgs(certId, other.address);
    });

    it("endorsement increments endorsementCount", async function () {
      await registry.connect(other).endorseCertificate(certId);
      const [cert] = await registry.verifyCertificate(certId);
      expect(cert.endorsementCount).to.equal(1);
    });

    it("getEndorsers returns the correct list of endorsers", async function () {
      await registry.connect(other).endorseCertificate(certId);
      const endorsers = await registry.getEndorsers(certId);
      expect(endorsers).to.include(other.address);
    });

    it("hasAddressEndorsed returns true after endorsement", async function () {
      await registry.connect(other).endorseCertificate(certId);
      expect(await registry.hasAddressEndorsed(certId, other.address)).to.be.true;
    });

    it("hasAddressEndorsed returns false before endorsement", async function () {
      expect(await registry.hasAddressEndorsed(certId, other.address)).to.be.false;
    });

    it("holder cannot endorse their own certificate", async function () {
      await expect(registry.connect(holder).endorseCertificate(certId))
        .to.be.revertedWith("Holder cannot endorse their own certificate");
    });

    it("same address cannot endorse twice", async function () {
      await registry.connect(other).endorseCertificate(certId);
      await expect(registry.connect(other).endorseCertificate(certId))
        .to.be.revertedWith("Already endorsed this certificate");
    });

    it("endorser can revoke their endorsement", async function () {
      await registry.connect(other).endorseCertificate(certId);
      await expect(registry.connect(other).revokeEndorsement(certId))
        .to.emit(registry, "EndorsementRevoked").withArgs(certId, other.address);
    });

    it("revokeEndorsement decrements endorsementCount", async function () {
      await registry.connect(other).endorseCertificate(certId);
      await registry.connect(other).revokeEndorsement(certId);
      const [cert] = await registry.verifyCertificate(certId);
      expect(cert.endorsementCount).to.equal(0);
    });

    it("reverts when revoking a non-existent endorsement", async function () {
      await expect(registry.connect(other).revokeEndorsement(certId))
        .to.be.revertedWith("No endorsement found to revoke");
    });

    it("endorseCertificate reverts on non-existent certificate", async function () {
      await expect(registry.connect(other).endorseCertificate(ethers.id("ghost")))
        .to.be.revertedWith("Certificate not found");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  verifyCertificate
  // ═══════════════════════════════════════════════════════════════════════════
  describe("verifyCertificate", function () {
    let certId;

    beforeEach(async function () {
      certId = ethers.id("cert-verify-001");
      await registry.connect(issuer).issueCertificate(certId, holder.address, "X", futureExp(), ethers.id("m"));
    });

    it("returns VALID (0) for a live certificate", async function () {
      const [, status] = await registry.verifyCertificate(certId);
      expect(status).to.equal(0);
    });

    it("returns REVOKED (1) after revocation", async function () {
      await registry.connect(issuer).revokeCertificate(certId, "fraud");
      const [, status] = await registry.verifyCertificate(certId);
      expect(status).to.equal(1);
    });

    it("returns EXPIRED (2) for a past-expiry certificate", async function () {
      // Anchor expiry to the current block timestamp (not wall-clock) to survive
      // cumulative evm_increaseTime calls from earlier tests in this file.
      const block      = await ethers.provider.getBlock("latest");
      const shortCertId = ethers.id("cert-expired-001");
      const shortExpiry = block.timestamp + 60;
      await registry.connect(issuer).issueCertificate(shortCertId, holder.address, "Short", shortExpiry, ethers.id("m"));
      await ethers.provider.send("evm_increaseTime", [120]);
      await ethers.provider.send("evm_mine", []);
      const [, status] = await registry.verifyCertificate(shortCertId);
      expect(status).to.equal(2);
    });

    it("reverts for a non-existent certificate", async function () {
      await expect(registry.verifyCertificate(ethers.id("ghost")))
        .to.be.revertedWith("Certificate not found");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  View helpers
  // ═══════════════════════════════════════════════════════════════════════════
  describe("View functions", function () {
    it("getCertificatesByHolder returns all cert IDs for an address", async function () {
      const id1 = ethers.id("multi-cert-1");
      const id2 = ethers.id("multi-cert-2");
      await registry.connect(issuer).issueCertificate(id1, holder.address, "A", futureExp(), ethers.id("m1"));
      await registry.connect(issuer).issueCertificate(id2, holder.address, "B", futureExp(), ethers.id("m2"));
      const certs = await registry.getCertificatesByHolder(holder.address);
      expect(certs.length).to.equal(2);
      expect(certs).to.include(id1);
      expect(certs).to.include(id2);
    });

    it("getIssuerInfo returns correct metadata", async function () {
      const info = await registry.getIssuerInfo(issuer.address);
      expect(info.name).to.equal("Acme University");
      expect(info.organization).to.equal("Faculty of Engineering");
      expect(info.active).to.be.true;
      expect(info.registeredAt).to.be.gt(0);
    });

    it("getContractStats reflects issued certs and active issuers", async function () {
      const certId = ethers.id("stats-cert");
      await registry.connect(issuer).issueCertificate(certId, holder.address, "X", futureExp(), ethers.id("m"));
      const [certs, issuers, isPaused] = await registry.getContractStats();
      expect(certs).to.equal(1);
      expect(issuers).to.equal(1);
      expect(isPaused).to.be.false;
    });

    it("isIssuer returns false for a non-registered address", async function () {
      expect(await registry.isIssuer(other.address)).to.be.false;
    });

    it("isIssuer returns false after removal", async function () {
      await registry.connect(owner).removeIssuer(issuer.address);
      expect(await registry.isIssuer(issuer.address)).to.be.false;
    });
  });
});
