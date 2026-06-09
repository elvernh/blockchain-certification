import { publicClient, getWalletClient, CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config';
import { keccak256, stringToBytes } from 'viem';

// ── Utility ───────────────────────────────────────────────────────────────────

export function toBytes32(str) {
  return keccak256(stringToBytes(str));
}

// ── READ: verify a certificate (no wallet needed) ─────────────────────────────

export async function verifyCertificate(certId) {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi:     CONTRACT_ABI,
      functionName: 'verifyCertificate',
      args: [certId],
    });
    const [cert, status] = result;
    const statusMap = { 0: 'VALID', 1: 'REVOKED', 2: 'EXPIRED' };
    return {
      cert: {
        certId:           cert.certId,
        holder:           cert.holder,
        issuer:           cert.issuer,
        name:             cert.name,
        issuedAt:         new Date(Number(cert.issuedAt)   * 1000).toLocaleDateString(),
        expiresAt:        new Date(Number(cert.expiresAt)  * 1000).toLocaleDateString(),
        revokeReason:     cert.revokeReason,
        endorsementCount: Number(cert.endorsementCount),
      },
      status: statusMap[status] ?? 'UNKNOWN',
    };
  } catch (err) {
    throw new Error(err.shortMessage || err.message);
  }
}

// ── READ: get all cert IDs held by an address ─────────────────────────────────

export async function getCertsByHolder(holderAddress) {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi:     CONTRACT_ABI,
    functionName: 'getCertificatesByHolder',
    args: [holderAddress],
  });
}

// ── READ: check if address is an active issuer ────────────────────────────────

export async function checkIsIssuer(address) {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi:     CONTRACT_ABI,
    functionName: 'isIssuer',
    args: [address],
  });
}

// ── READ: get issuer name / organisation metadata ─────────────────────────────

export async function getIssuerInfo(address) {
  try {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi:     CONTRACT_ABI,
      functionName: 'getIssuerInfo',
      args: [address],
    });
  } catch {
    return null;
  }
}

// ── READ: get addresses that endorsed a certificate ───────────────────────────

export async function getEndorsers(certIdBytes32) {
  try {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi:     CONTRACT_ABI,
      functionName: 'getEndorsers',
      args: [certIdBytes32],
    });
  } catch {
    return [];
  }
}

// ── READ: check if an address has endorsed a cert ────────────────────────────

export async function hasAddressEndorsed(certIdBytes32, endorser) {
  try {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi:     CONTRACT_ABI,
      functionName: 'hasAddressEndorsed',
      args: [certIdBytes32, endorser],
    });
  } catch {
    return false;
  }
}

// ── READ: registry-wide statistics ───────────────────────────────────────────

export async function getContractStats() {
  try {
    const [totalCerts, totalIssuers, paused] = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi:     CONTRACT_ABI,
      functionName: 'getContractStats',
    });
    return { totalCerts: Number(totalCerts), totalIssuers: Number(totalIssuers), paused };
  } catch {
    return null;
  }
}

// ── WRITE: issue a certificate ────────────────────────────────────────────────

export async function issueCertificate({ certIdStr, holderAddress, name, expiryDate, metadataHash }) {
  const walletClient = await getWalletClient();
  const [account]    = await walletClient.getAddresses();

  const certId   = toBytes32(certIdStr);
  const expiry   = BigInt(Math.floor(new Date(expiryDate).getTime() / 1000));
  const metaHash = toBytes32(metadataHash || certIdStr);

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi:     CONTRACT_ABI,
    functionName: 'issueCertificate',
    args:    [certId, holderAddress, name, expiry, metaHash],
    account,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}

// ── WRITE: revoke a certificate ───────────────────────────────────────────────

export async function revokeCertificate({ certIdStr, reason }) {
  const walletClient = await getWalletClient();
  const [account]    = await walletClient.getAddresses();
  const certId       = toBytes32(certIdStr);

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi:     CONTRACT_ABI,
    functionName: 'revokeCertificate',
    args:    [certId, reason],
    account,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}

// ── WRITE: renew a certificate ────────────────────────────────────────────────

export async function renewCertificate({ certIdStr, newExpiryDate }) {
  const walletClient = await getWalletClient();
  const [account]    = await walletClient.getAddresses();
  const certId       = toBytes32(certIdStr);
  const newExpiry    = BigInt(Math.floor(new Date(newExpiryDate).getTime() / 1000));

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi:     CONTRACT_ABI,
    functionName: 'renewCertificate',
    args:    [certId, newExpiry],
    account,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}

// ── WRITE: endorse a certificate ──────────────────────────────────────────────

export async function endorseCertificate(certIdBytes32) {
  const walletClient = await getWalletClient();
  const [account]    = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi:     CONTRACT_ABI,
    functionName: 'endorseCertificate',
    args:    [certIdBytes32],
    account,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}

// ── WRITE: revoke an endorsement ─────────────────────────────────────────────

export async function revokeEndorsement(certIdBytes32) {
  const walletClient = await getWalletClient();
  const [account]    = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi:     CONTRACT_ABI,
    functionName: 'revokeEndorsement',
    args:    [certIdBytes32],
    account,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}

// ── WRITE: add an issuer (owner only) ─────────────────────────────────────────

export async function addIssuer(issuerAddress, name, organization) {
  const walletClient = await getWalletClient();
  const [account]    = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi:     CONTRACT_ABI,
    functionName: 'addIssuer',
    args:    [issuerAddress, name || '', organization || ''],
    account,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}
