# AGV Protocol Staking Implementation

## Overview

This implementation provides a comprehensive NFT staking system with off-chain reward calculation using the specifications from the provided URLs. The system includes:

1. **Off-chain reward calculation** with bonus multipliers
2. **Thirdweb v5 integration** for NFT detection
3. **Firebase Admin SDK** for server-side operations
4. **API endpoints** for stake recording and reward calculation
5. **Enhanced UI** with staked vs unstaked NFT differentiation

## Features Implemented

### 1. Reward Calculation System (`lib/rewards.ts`)

- **Base Daily Rewards**: Seed (1 rGGP), Tree (5 rGGP), Solar (25 rGGP), Compute (100 rGGP)
- **Bonus Multipliers**: 7 days (1x), 30 days (1.2x), 90 days (1.5x), 180 days (2x), 1 year (3x), 2 years (5x)
- **Formula**: `Final Reward = Base Daily Reward × Number of Days Staked × Bonus Multiplier`

### 2. API Endpoints

#### `/api/stakes` (POST)
Records new stakes in the database with proper reward calculation.

#### `/api/rewards` (GET)
Returns computed rewards for a wallet with lazy accrual updates.

#### `/api/stakes/unstake` (POST)
Finalizes stakes when tokens are unstaked.

### 3. NFT Detection (`hooks/useStakingView.ts`)

- Uses thirdweb v5 indexer for automatic NFT detection
- Supports both ERC-721 and ERC-1155 standards
- Differentiates between staked and unstaked NFTs
- Cross-chain support (BSC, Arbitrum, Polygon)

### 4. Enhanced UI Features

- **Reward Dashboard**: Shows total accrued rGGP with bonus multipliers
- **NFT Grid**: Visual display of available vs staked NFTs
- **Real-time Updates**: Automatic reward calculation and display
- **Chain Selection**: Support for multiple blockchain networks

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
```

### 2. Firebase Setup

1. Create a Firebase project
2. Generate a service account key
3. Download the JSON file and extract the required fields
4. Set up Firestore database

### 3. Thirdweb Setup

1. Create a thirdweb account
2. Get your client ID from the dashboard
3. Ensure your NFT contracts are deployed and indexed

### 4. Contract Configuration

Update `lib/agv-config.ts` with your actual contract addresses:

```typescript
export const AGV_COLLECTIONS: AgvCollection[] = [
  {
    kind: "SEED",
    standard: "ERC721",
    chain: { id: 56 }, // BSC
    address: "0xYourSeedContractAddress",
    stakingAddress: "0xYourSeedStakingContract",
    nftAbi: TREE_ABI,
  },
  // ... other collections
];
```

## Usage

### Staking NFTs

1. Connect wallet
2. Select chain and collection
3. Choose staking duration (affects bonus multiplier)
4. Select NFTs to stake
5. Confirm transaction
6. Stakes are automatically recorded in the API

### Viewing Rewards

- Rewards are calculated in real-time
- Shows accrued rGGP with bonus multipliers
- Displays individual stake details
- Updates automatically as time passes

### NFT Management

- Automatic detection of owned NFTs
- Clear differentiation between staked and unstaked
- Visual grid layout with metadata
- Support for multiple chains

## Technical Details

### Reward Calculation

The system uses UTC-based day counting for consistent reward calculation:

```typescript
// Example: TreePass staked for 30 days
// Base: 5 rGGP/day
// Multiplier: 1.2x (30-day bonus)
// Total: 5 × 30 × 1.2 = 180 rGGP
```

### Data Storage

- **Stakes Collection**: Stores individual stake records
- **Lazy Accrual**: Updates rewards only when needed
- **Idempotent**: Safe to call multiple times
- **Chain Agnostic**: Works across multiple blockchains

### Security

- Server-side API operations only
- Client-side read-only access
- Proper validation and error handling
- No sensitive data exposure

## Future Enhancements

1. **On-chain Claiming**: When GGP token launches
2. **Batch Operations**: Stake multiple NFTs at once
3. **Analytics Dashboard**: Detailed reward history
4. **Mobile Optimization**: Responsive design improvements
5. **Notification System**: Reward milestone alerts

## Troubleshooting

### Common Issues

1. **NFTs not detected**: Check thirdweb indexer status
2. **Rewards not updating**: Verify Firebase connection
3. **API errors**: Check environment variables
4. **Contract errors**: Verify contract addresses

### Support

For technical support, check:
- Firebase console for database issues
- Thirdweb dashboard for indexer status
- Browser console for client-side errors
- Server logs for API issues
