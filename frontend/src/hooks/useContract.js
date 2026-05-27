import { useState } from 'react';
import { publicClient, getWalletClient, CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config';
import { toHex, fromHex, keccak256, stringToBytes } from 'viem';

// ── Utility: convert string to bytes32 (same as ethers.encodeBytes32String)
export function toBytes32(str) {
  return keccak256(stringToBytes(str));
}

// ── READ: verify a certificate (no wallet needed)
export async function verifyCertificate(certId) {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'verifyCertificate',
      args: [certId],
    });
    // result = [certStruct, statusEnum]
    const [cert, status] = result;
    const statusMap = { 0: 'VALID', 1: 'REVOKED', 2: 'EXPIRED' };
    return {
      cert: {
        certId: cert.certId,
        holder: cert.holder,
        issuer: cert.issuer,
        name: cert.name,
        issuedAt: new Date(Number(cert.issuedAt) * 1000).toLocaleDateString(),
        expiresAt: new Date(Number(cert.expiresAt) * 1000).toLocaleDateString(),
        revokeReason: cert.revokeReason,
      },
      status: statusMap[status] ?? 'UNKNOWN',
    };
  } catch (err) {
    throw new Error(err.shortMessage || err.message);
  }
}

// ── READ: get all certs by holder address
export async function getCertsByHolder(holderAddress) {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCertificatesByHolder',
    args: [holderAddress],
  });
}

// ── READ: check if address is issuer
export async function checkIsIssuer(address) {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'isIssuer',
    args: [address],
  });
}

// ── WRITE: issue a certificate
export async function issueCertificate({ certIdStr, holderAddress, name, expiryDate, metadataHash }) {
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  const certId = toBytes32(certIdStr);
  const expiry = BigInt(Math.floor(new Date(expiryDate).getTime() / 1000));
  const metaHash = toBytes32(metadataHash);

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'issueCertificate',
    args: [certId, holderAddress, name, expiry, metaHash],
    account,
  });

  // Wait for transaction to be mined
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt;
}

// ── WRITE: revoke a certificate
export async function revokeCertificate({ certIdStr, reason }) {
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  const certId = toBytes32(certIdStr);

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'revokeCertificate',
    args: [certId, reason],
    account,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}

// ── WRITE: renew a certificate
export async function renewCertificate({ certIdStr, newExpiryDate }) {
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  const certId = toBytes32(certIdStr);
  const newExpiry = BigInt(Math.floor(new Date(newExpiryDate).getTime() / 1000));

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'renewCertificate',
    args: [certId, newExpiry],
    account,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}

// ── WRITE: add issuer (owner only)
export async function addIssuer(issuerAddress) {
  const walletClient = await getWalletClient();
  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'addIssuer',
    args: [issuerAddress],
    account,
  });

  return publicClient.waitForTransactionReceipt({ hash });
}