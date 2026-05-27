import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { hardhat, sepolia } from 'viem/chains';

// ABI and deployed address pulled directly from cert-blockchain — always in sync
import CertABI from '../../../cert-blockchain/artifacts/contracts/CertificationRegistry.sol/CertificationRegistry.json';
import deployedAddresses from '../../../cert-blockchain/ignition/deployments/chain-31337/deployed_addresses.json';

export const CONTRACT_ADDRESS = deployedAddresses['CertificationRegistryModule#CertificationRegistry'];
export const CONTRACT_ABI = CertABI.abi;

// Use 'hardhat' for local, 'sepolia' for testnet
export const CHAIN = hardhat;

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(),
});

// Prefer Rabby's dedicated provider; fall back to window.ethereum if Rabby is active there
export const getRabbyProvider = () => {
  if (window.rabby) return window.rabby;
  if (window.ethereum?.isRabby) return window.ethereum;
  throw new Error('Rabby Wallet not detected. Please install Rabby and refresh.');
};

export const getWalletClient = async () => {
  const provider = getRabbyProvider();
  return createWalletClient({
    chain: CHAIN,
    transport: custom(provider),
  });
};
