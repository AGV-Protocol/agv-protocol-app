export const CHAINS = {
  '56': {
    name: 'BNB Chain',
    chainId: '0x38',
    network: 'binance',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorer: 'https://bscscan.com/',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
  },
  '137': {
    name: 'Polygon',
    chainId: '0x89',
    network: 'polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com/',
    blockExplorer: 'https://polygonscan.com/',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  },
  '42161': {
    name: 'Arbitrum',
    chainId: '0xa4b1',
    network: 'arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io/',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
  }
};

export const USDT_ADDRESSES = {
  '56': '0x55d398326f99059fF775485246999027B3197955',
  '137': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  '42161': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
};

export const NFT_CONTRACTS = {
  seed: {
    '56': '0xFF362C39eB0eDecA946A5528d30D9c9E9285f3fc',
    '137': '0x492a86EdEEa01158FcD3C8f2348A4c0431b8A24d',
    '42161': '0x90b9E1C8645bC731be19537A4932B26Fc218e464'
  },
  tree: {
    '56': '0x1E092126E4AB12503d37dD08E20F9192b8439458',
    '137': '1944f237b8775ae985107dd2F877d5c5bbaaea31f',
    '42161': '0xc574AB1e7e2B27ff4460C299E3448C572894276A'
  },
  solar: {
    '56': '', // Placeholder
    '137': '0x19B21F15C2E49dD0697e6D3499C82f0B899B97f2',
    '42161': '0x492a86EdEEa01158FcD3C8f2348A4c0431b8A24d'
  },
  compute: {
    '56': '', // Placeholder
    '137': '0xa2c1381B89FD986B4dbA4dbb03167A7655107308',
    '42161': '0xf44F237b8775AE985107dd2F877d5c5BBaAea31f'
  }
};

export const CLIENT_ID = 'b4616379dd466ee683b2901b7f291aa5';