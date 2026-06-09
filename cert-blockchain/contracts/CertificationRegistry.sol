// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  CertificationRegistry
 * @notice Tamper-proof on-chain registry for issuing, verifying, revoking,
 *         renewing, transferring, and endorsing academic / professional
 *         certificates.  Supports a three-actor model:
 *           • Owner   – deploys and administers the registry
 *           • Issuers – authenticated institutions that certify holders
 *           • Anyone  – can verify or endorse a certificate
 */
contract CertificationRegistry {

    // ─── Enums ────────────────────────────────────────────────────────────────

    enum CertStatus { VALID, REVOKED, EXPIRED }

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Certificate {
        bytes32    certId;
        address    holder;
        address    issuer;
        string     name;
        uint256    issuedAt;
        uint256    expiresAt;
        bytes32    metadataHash;
        CertStatus status;
        string     revokeReason;
        uint256    endorsementCount;
    }

    struct IssuerInfo {
        string  name;
        string  organization;
        uint256 registeredAt;
        uint256 totalIssued;
        bool    active;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    bool    public paused;
    uint256 public totalCertificates;
    uint256 public totalIssuers;

    mapping(address => bool)       private _issuerActive;
    mapping(address => IssuerInfo) public  issuerInfo;

    mapping(bytes32 => Certificate) private certificates;
    mapping(address => bytes32[])   private holderCerts;

    // Endorsements: certId → endorser → bool
    mapping(bytes32 => mapping(address => bool)) private _hasEndorsed;
    mapping(bytes32 => address[])                private certEndorsers;

    // ─── Events ───────────────────────────────────────────────────────────────

    event CertificateIssued(
        bytes32 indexed certId,
        address indexed holder,
        address indexed issuer,
        string  name,
        uint256 expiry
    );
    event CertificateRevoked(
        bytes32 indexed certId,
        address indexed revokedBy,
        string  reason
    );
    event CertificateRenewed(
        bytes32 indexed certId,
        address indexed renewedBy,
        uint256 newExpiry
    );
    event CertificateTransferred(
        bytes32 indexed certId,
        address indexed from,
        address indexed to
    );
    event CertificateEndorsed(
        bytes32 indexed certId,
        address indexed endorser
    );
    event EndorsementRevoked(
        bytes32 indexed certId,
        address indexed endorser
    );
    event IssuerAdded(
        address indexed issuer,
        address indexed addedBy
    );
    event IssuerRemoved(
        address indexed issuer,
        address indexed removedBy
    );
    event IssuerMetadataSet(
        address indexed issuer,
        string  name,
        string  organization
    );
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyIssuer() {
        require(_issuerActive[msg.sender], "Not an active issuer");
        _;
    }

    /// @dev Ensures only the issuer who originally issued the cert can act on it.
    modifier onlyOriginalIssuer(bytes32 certId) {
        require(certificates[certId].issuer == msg.sender, "Not the original issuer");
        _;
    }

    modifier certExists(bytes32 certId) {
        require(certificates[certId].issuedAt != 0, "Certificate not found");
        _;
    }

    modifier notRevoked(bytes32 certId) {
        require(
            certificates[certId].status != CertStatus.REVOKED,
            "Certificate already revoked"
        );
        _;
    }

    modifier onlyCertHolder(bytes32 certId) {
        require(certificates[certId].holder == msg.sender, "Not certificate holder");
        _;
    }

    /// @dev Blocks state-changing operations while the contract is paused.
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /// @dev Rejects zero-address inputs.
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address: zero address");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Admin functions ──────────────────────────────────────────────────────

    /**
     * @notice Grant issuer privileges and store institution metadata.
     * @param _issuer       Wallet address of the new issuer.
     * @param name          Human-readable name of the issuing authority.
     * @param organization  Organisation / institution the issuer represents.
     */
    function addIssuer(
        address _issuer,
        string calldata name,
        string calldata organization
    ) external onlyOwner validAddress(_issuer) {
        require(!_issuerActive[_issuer], "Already an active issuer");
        _issuerActive[_issuer] = true;
        issuerInfo[_issuer] = IssuerInfo({
            name:         name,
            organization: organization,
            registeredAt: block.timestamp,
            totalIssued:  0,
            active:       true
        });
        totalIssuers++;
        emit IssuerAdded(_issuer, msg.sender);
        emit IssuerMetadataSet(_issuer, name, organization);
    }

    /**
     * @notice Revoke an issuer's privileges (certificates already issued remain valid).
     */
    function removeIssuer(address _issuer) external onlyOwner {
        require(_issuerActive[_issuer], "Not an active issuer");
        _issuerActive[_issuer] = false;
        issuerInfo[_issuer].active = false;
        totalIssuers--;
        emit IssuerRemoved(_issuer, msg.sender);
    }

    /**
     * @notice Update an existing issuer's display metadata.
     */
    function setIssuerMetadata(
        address _issuer,
        string calldata name,
        string calldata organization
    ) external onlyOwner {
        require(_issuerActive[_issuer], "Not an active issuer");
        issuerInfo[_issuer].name         = name;
        issuerInfo[_issuer].organization = organization;
        emit IssuerMetadataSet(_issuer, name, organization);
    }

    /**
     * @notice Pause all state-changing certificate operations (emergency stop).
     */
    function pauseContract() external onlyOwner {
        require(!paused, "Already paused");
        paused = true;
        emit ContractPaused(msg.sender);
    }

    /**
     * @notice Resume normal operations after a pause.
     */
    function unpauseContract() external onlyOwner {
        require(paused, "Not currently paused");
        paused = false;
        emit ContractUnpaused(msg.sender);
    }

    /**
     * @notice Transfer administrative ownership of the registry.
     */
    function transferOwnership(address newOwner)
        external onlyOwner validAddress(newOwner)
    {
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─── Issuer functions ─────────────────────────────────────────────────────

    /**
     * @notice Issue a new certificate on-chain.
     */
    function issueCertificate(
        bytes32 certId,
        address holder,
        string calldata name,
        uint256 expiry,
        bytes32 metaHash
    ) external onlyIssuer whenNotPaused validAddress(holder) {
        require(certificates[certId].issuedAt == 0, "Certificate ID already exists");
        require(expiry > block.timestamp, "Expiry must be in the future");

        certificates[certId] = Certificate({
            certId:           certId,
            holder:           holder,
            issuer:           msg.sender,
            name:             name,
            issuedAt:         block.timestamp,
            expiresAt:        expiry,
            metadataHash:     metaHash,
            status:           CertStatus.VALID,
            revokeReason:     "",
            endorsementCount: 0
        });

        holderCerts[holder].push(certId);
        issuerInfo[msg.sender].totalIssued++;
        totalCertificates++;

        emit CertificateIssued(certId, holder, msg.sender, name, expiry);
    }

    /**
     * @notice Revoke a certificate. Only the original issuer may call this.
     */
    function revokeCertificate(bytes32 certId, string calldata reason)
        external
        onlyIssuer
        certExists(certId)
        notRevoked(certId)
        onlyOriginalIssuer(certId)
    {
        certificates[certId].status      = CertStatus.REVOKED;
        certificates[certId].revokeReason = reason;
        emit CertificateRevoked(certId, msg.sender, reason);
    }

    /**
     * @notice Extend a certificate's validity period. Only the original issuer may call.
     */
    function renewCertificate(bytes32 certId, uint256 newExpiry)
        external
        onlyIssuer
        certExists(certId)
        notRevoked(certId)
        onlyOriginalIssuer(certId)
    {
        require(newExpiry > block.timestamp, "New expiry must be in the future");
        certificates[certId].expiresAt = newExpiry;
        certificates[certId].status    = CertStatus.VALID;
        emit CertificateRenewed(certId, msg.sender, newExpiry);
    }

    // ─── Holder functions ─────────────────────────────────────────────────────

    /**
     * @notice Transfer certificate ownership to a new holder.
     */
    function transferCertificate(bytes32 certId, address newHolder)
        external
        certExists(certId)
        notRevoked(certId)
        onlyCertHolder(certId)
        whenNotPaused
        validAddress(newHolder)
    {
        address oldHolder = certificates[certId].holder;
        certificates[certId].holder = newHolder;
        holderCerts[newHolder].push(certId);
        emit CertificateTransferred(certId, oldHolder, newHolder);
    }

    // ─── Public functions ─────────────────────────────────────────────────────

    /**
     * @notice Endorse a certificate — any address except the holder may vouch for it.
     *         Endorsements act as third-party credibility signals.
     */
    function endorseCertificate(bytes32 certId)
        external
        certExists(certId)
        whenNotPaused
    {
        require(
            certificates[certId].holder != msg.sender,
            "Holder cannot endorse their own certificate"
        );
        require(!_hasEndorsed[certId][msg.sender], "Already endorsed this certificate");

        _hasEndorsed[certId][msg.sender] = true;
        certEndorsers[certId].push(msg.sender);
        certificates[certId].endorsementCount++;

        emit CertificateEndorsed(certId, msg.sender);
    }

    /**
     * @notice Remove a previously given endorsement.
     */
    function revokeEndorsement(bytes32 certId) external certExists(certId) {
        require(_hasEndorsed[certId][msg.sender], "No endorsement found to revoke");
        _hasEndorsed[certId][msg.sender] = false;
        certificates[certId].endorsementCount--;
        emit EndorsementRevoked(certId, msg.sender);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    /**
     * @notice Return a certificate's data and its live status.
     *         Status is computed dynamically (REVOKED > EXPIRED > VALID).
     */
    function verifyCertificate(bytes32 certId)
        external view
        certExists(certId)
        returns (Certificate memory cert, CertStatus currentStatus)
    {
        cert = certificates[certId];
        if (cert.status == CertStatus.REVOKED) {
            currentStatus = CertStatus.REVOKED;
        } else if (block.timestamp > cert.expiresAt) {
            currentStatus = CertStatus.EXPIRED;
        } else {
            currentStatus = CertStatus.VALID;
        }
    }

    /**
     * @notice Return all certificate IDs held by a given address.
     */
    function getCertificatesByHolder(address holder)
        external view returns (bytes32[] memory)
    {
        return holderCerts[holder];
    }

    /**
     * @notice Return the list of addresses that have endorsed a certificate.
     */
    function getEndorsers(bytes32 certId)
        external view certExists(certId) returns (address[] memory)
    {
        return certEndorsers[certId];
    }

    /**
     * @notice Check whether a specific address has endorsed a certificate.
     */
    function hasAddressEndorsed(bytes32 certId, address endorser)
        external view returns (bool)
    {
        return _hasEndorsed[certId][endorser];
    }

    /**
     * @notice Check whether an address is currently an active issuer.
     */
    function isIssuer(address _addr) external view returns (bool) {
        return _issuerActive[_addr];
    }

    /**
     * @notice Return stored metadata for an issuer.
     */
    function getIssuerInfo(address _addr)
        external view returns (IssuerInfo memory)
    {
        return issuerInfo[_addr];
    }

    /**
     * @notice Return high-level registry statistics.
     */
    function getContractStats()
        external view
        returns (uint256 _totalCerts, uint256 _totalIssuers, bool _paused)
    {
        return (totalCertificates, totalIssuers, paused);
    }
}
