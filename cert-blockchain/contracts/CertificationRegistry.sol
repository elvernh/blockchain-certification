// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificationRegistry {

    enum CertStatus { VALID, REVOKED, EXPIRED }

    struct Certificate {
        bytes32 certId;
        address holder;
        address issuer;
        string name;
        uint256 issuedAt;
        uint256 expiresAt;
        bytes32 metadataHash;
        CertStatus status;
        string revokeReason;
    }

    address public owner;
    mapping(address => bool) private issuers;
    mapping(bytes32 => Certificate) private certificates;
    mapping(address => bytes32[]) private holderCerts;

    event CertificateIssued(bytes32 indexed certId, address indexed holder, address indexed issuer, uint256 expiry);
    event CertificateRevoked(bytes32 indexed certId, address indexed issuer, string reason);
    event CertificateRenewed(bytes32 indexed certId, uint256 newExpiry, address indexed issuer);
    event OwnershipTransferred_Cert(bytes32 indexed certId, address indexed from, address indexed to);
    event IssuerAdded(address indexed issuerAddress, address indexed addedBy);
    event IssuerRemoved(address indexed issuerAddress, address indexed removedBy);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    modifier onlyIssuer() {
        require(issuers[msg.sender], "Not a registered issuer");
        _;
    }
    modifier certExists(bytes32 certId) {
        require(certificates[certId].issuedAt != 0, "Certificate not found");
        _;
    }
    modifier notRevoked(bytes32 certId) {
        require(certificates[certId].status != CertStatus.REVOKED, "Certificate already revoked");
        _;
    }
    modifier onlyCertHolder(bytes32 certId) {
        require(certificates[certId].holder == msg.sender, "Not certificate holder");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "Invalid address");
        require(!issuers[_issuer], "Already an issuer");
        issuers[_issuer] = true;
        emit IssuerAdded(_issuer, msg.sender);
    }

    function removeIssuer(address _issuer) external onlyOwner {
        require(issuers[_issuer], "Not an issuer");
        issuers[_issuer] = false;
        emit IssuerRemoved(_issuer, msg.sender);
    }

    function issueCertificate(
        bytes32 certId,
        address holder,
        string calldata name,
        uint256 expiry,
        bytes32 metaHash
    ) external onlyIssuer {
        require(certificates[certId].issuedAt == 0, "Certificate ID already exists");
        require(expiry > block.timestamp, "Expiry must be in the future");

        certificates[certId] = Certificate({
            certId: certId,
            holder: holder,
            issuer: msg.sender,
            name: name,
            issuedAt: block.timestamp,
            expiresAt: expiry,
            metadataHash: metaHash,
            status: CertStatus.VALID,
            revokeReason: ""
        });

        holderCerts[holder].push(certId);
        emit CertificateIssued(certId, holder, msg.sender, expiry);
    }

    function revokeCertificate(bytes32 certId, string calldata reason)
        external onlyIssuer certExists(certId) notRevoked(certId)
    {
        certificates[certId].status = CertStatus.REVOKED;
        certificates[certId].revokeReason = reason;
        emit CertificateRevoked(certId, msg.sender, reason);
    }

    function renewCertificate(bytes32 certId, uint256 newExpiry)
        external onlyIssuer certExists(certId) notRevoked(certId)
    {
        require(newExpiry > block.timestamp, "New expiry must be in the future");
        certificates[certId].expiresAt = newExpiry;
        certificates[certId].status = CertStatus.VALID;
        emit CertificateRenewed(certId, newExpiry, msg.sender);
    }

    function transferCertificate(bytes32 certId, address newHolder)
        external certExists(certId) notRevoked(certId) onlyCertHolder(certId)
    {
        address oldHolder = certificates[certId].holder;
        certificates[certId].holder = newHolder;
        holderCerts[newHolder].push(certId);
        emit OwnershipTransferred_Cert(certId, oldHolder, newHolder);
    }

    function verifyCertificate(bytes32 certId)
        external view certExists(certId)
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
        return (cert, currentStatus);
    }

    function getCertificatesByHolder(address holder)
        external view returns (bytes32[] memory)
    {
        return holderCerts[holder];
    }

    function isIssuer(address _addr) external view returns (bool) {
        return issuers[_addr];
    }
}