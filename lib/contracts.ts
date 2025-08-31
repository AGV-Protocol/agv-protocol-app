import { defineChain } from "thirdweb/chains";

export const CHAINS = {
  "56": {
    chainId: "56",
    name: "Binance Smart Chain",
    symbol: "BNB",
    chain: defineChain(56),
  },
  "137": {
    chainId: "137",
    name: "Polygon",
    symbol: "MATIC",
    chain: defineChain(137),
  },
  "42161": {
    chainId: "42161",
    name: "Arbitrum One",
    symbol: "ETH",
    chain: defineChain(42161),
  },
};

export const USDT_ADDRESSES: Record<string, string> = {
  '56': '0x55d398326f99059ff775485246999027b3197955', // BSC USDT
  '137': '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // Polygon USDT
  '42161': '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // Arbitrum USDT
};

export const NFT_CONTRACTS: Record<string, Record<string, string>> = {
  seed: {
    '56': '0xFF362C39eB0eDecA946A5528d30D9c9E9285f3fc',
    '137': '0x492a86EdEEa01158FcD3C8f2348A4c0431b8A24d',
    '42161': '0x90b9E1C8645bC731be19537A4932B26Fc218e464',
  },
  tree: {
    '56': '0x1E092126E4AB12503d37dD08E20F9192b8439458',
    '137': '0xf44f237b8775ae985107dd2f877d5c5bbaaea31f',
    '42161': '0xc574AB1e7e2B27ff4460C299E3448C572894276A',
  },
  solar: {
    '56': '0x0000000000000000000000000000000000000000', // Placeholder: Not available
    '137': '0x0000000000000000000000000000000000000000', // Placeholder: Not available
    '42161': '0x0000000000000000000000000000000000000000', // Placeholder: Not available
  },
  compute: {
    '56': '0x0000000000000000000000000000000000000000', // Placeholder: Not available
    '137': '0x0000000000000000000000000000000000000000', // Placeholder: Not available
    '42161': '0x0000000000000000000000000000000000000000', // Placeholder: Not available
  },
};

export const NFT_ABI = [
  {
    "type": "function",
    "name": "mint",
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "bytes32[]",
        "name": "merkleProof",
        "type": "bytes32[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [
      {
        "internalType": "uint256",
        "name": "result",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "usdtToken",
    "inputs": [],
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "whitelistMerkleRoot",
    "inputs": [],
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view"
  }
];

export const USDT_ABI = [
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowance",
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transfer",
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable"
  }
];