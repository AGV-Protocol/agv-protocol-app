// Simplified contracts configuration without Thirdweb imports
// This avoids ES module compatibility issues

export const CHAINS = {
  "56": {
    chainId: "56",
    name: "Binance Smart Chain",
    symbol: "BNB",
    explorer: "https://bscscan.com",
  },
  "137": {
    chainId: "137",
    name: "Polygon",
    symbol: "MATIC",
    explorer: "https://polygonscan.com",
  },
  "42161": {
    chainId: "42161",
    name: "Arbitrum One",
    symbol: "ETH",
    explorer: "https://arbiscan.io",
  },
} as const;

export const USDT_ADDRESSES = {
  "56": "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
  "137": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // Polygon USDT
  "42161": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum USDT
} as const;

export const NFT_CONTRACTS = {
  "56": {
    seed: "0x1234567890123456789012345678901234567890", // Placeholder
    tree: "0x1234567890123456789012345678901234567890", // Placeholder
    solar: "0x1234567890123456789012345678901234567890", // Placeholder
    compute: "0x1234567890123456789012345678901234567890", // Placeholder
  },
  "137": {
    seed: "0x1234567890123456789012345678901234567890", // Placeholder
    tree: "0x1234567890123456789012345678901234567890", // Placeholder
    solar: "0x1234567890123456789012345678901234567890", // Placeholder
    compute: "0x1234567890123456789012345678901234567890", // Placeholder
  },
  "42161": {
    seed: "0x1234567890123456789012345678901234567890", // Placeholder
    tree: "0x1234567890123456789012345678901234567890", // Placeholder
    solar: "0x1234567890123456789012345678901234567890", // Placeholder
    compute: "0x1234567890123456789012345678901234567890", // Placeholder
  },
} as const;

// Simplified ABI for ERC20 USDT
export const USDT_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Simplified ABI for NFT contracts
export const NFT_ABI = [
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "quantity", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export type ChainId = keyof typeof CHAINS;
export type CollectionKey = keyof typeof NFT_CONTRACTS["56"];
