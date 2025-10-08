import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  LockTier, 
  NftType, 
  AprData, 
  XpData, 
  NftsData, 
  TiersData,
  LeaderboardData,
  getVaultData,
  getLeaderboard
} from './api';
import { 
  dailyYield, 
  calculateAccrued, 
  clampDaily, 
  perSecondRate 
} from './math';

export interface WalletNFT {
  tokenAddress: string;
  tokenIdStr: string;
  contractType: string;
  name: string | null;
  imageUrl: string | null;
}

export interface LockedNFT {
  tokenAddress: string;
  tokenIdStr: string;
  contractType: string;
  name: string | null;
  imageUrl: string | null;
  nftType: string;
  lockTier: LockTier;
  lockTimestamp: number;
}

export interface VaultState {
  // Wallet and tier selection
  wallet?: `0x${string}`;
  tier: LockTier;
  chainKey: "56" | "42161" | "137";
  
  // Data
  xp?: XpData;
  tiers?: TiersData;
  positions: Array<{ type: NftType; start_ts: number; lock_tier?: string }>;
  leaderboard?: LeaderboardData;
  lockedNfts: LockedNFT[];
  
  // Computed values
  rggpAccrued: number;
  dailyYieldTotal: number;
  perSecondRate: number;
  
  // Loading states
  isLoading: boolean;
  error?: string;
  
  // Actions
  setWallet: (wallet: `0x${string}`) => void;
  setTier: (tier: LockTier) => void;
  setChainKey: (chainKey: "56" | "42161" | "137") => void;
  setLockedNfts: (nfts: LockedNFT[]) => void;
  unlockNft: (tokenAddress: string, tokenIdStr: string) => void;
  unlockAllNfts: () => void;
  validateLockedNfts: (walletNfts: WalletNFT[]) => void;
  hydrateFromApis: (wallet: string) => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useVaultStore = create<VaultState>()(
  devtools(
    (set, get) => ({
      // Initial state
      wallet: undefined,
      tier: 'flex',
      chainKey: '56',
      xp: undefined,
      tiers: undefined,
      positions: [],
      leaderboard: undefined,
      lockedNfts: [],
      rggpAccrued: 0,
      dailyYieldTotal: 0,
      perSecondRate: 0,
      isLoading: false,
      error: undefined,

      // Actions
      setWallet: (wallet) => {
        set({ wallet });
        // Auto-hydrate data when wallet is set
        if (wallet) {
          get().hydrateFromApis(wallet);
        }
      },

      setTier: (tier) => {
        set({ tier });
        // Recalculate yields when tier changes
        get().recalculateYields();
      },

      setChainKey: (chainKey) => {
        set({ chainKey });
      },

      setLockedNfts: (lockedNfts) => {
        set({ lockedNfts });
        // Recalculate yields when locked NFTs change
        get().recalculateYields();
      },

      unlockNft: (tokenAddress, tokenIdStr) => {
        const { lockedNfts } = get();
        const updatedNfts = lockedNfts.filter(
          nft => !(nft.tokenAddress === tokenAddress && nft.tokenIdStr === tokenIdStr)
        );
        set({ lockedNfts: updatedNfts });
        get().recalculateYields();
      },

      unlockAllNfts: () => {
        set({ lockedNfts: [] });
        get().recalculateYields();
      },

      validateLockedNfts: (walletNfts) => {
        const { lockedNfts } = get();
        const validNfts = lockedNfts.filter(lockedNft => 
          walletNfts.some(walletNft => 
            walletNft.tokenAddress.toLowerCase() === lockedNft.tokenAddress.toLowerCase() &&
            walletNft.tokenIdStr === lockedNft.tokenIdStr
          )
        );
        
        if (validNfts.length !== lockedNfts.length) {
          set({ lockedNfts: validNfts });
          get().recalculateYields();
        }
      },

      hydrateFromApis: async (wallet) => {
        set({ isLoading: true, error: undefined });
        
        try {
          const { apr, xp, nfts, tiers } = await getVaultData(wallet);
          const leaderboard = await getLeaderboard();
          
          set({
            xp,
            tiers,
            positions: nfts.positions,
            leaderboard,
            isLoading: false
          });
          
          // Recalculate yields with new data
          get().recalculateYields();
        } catch (error) {
          console.error('Error hydrating vault data:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load vault data',
            isLoading: false
          });
        }
      },

      refreshData: async () => {
        const { wallet } = get();
        if (wallet) {
          await get().hydrateFromApis(wallet);
        }
      },

      clearError: () => set({ error: undefined }),

      // Helper method to recalculate yields
      recalculateYields: () => {
        const { tier, xp, tiers, lockedNfts } = get();
        
        if (!tiers || !xp) return;

        const tierData = tiers.tiers[tier];
        const nftMultipliers = tiers.nftMultipliers;
        
        let totalDailyYield = 0;
        let totalAccrued = 0;
        
        lockedNfts.forEach(lockedNft => {
          const nftMult = nftMultipliers[lockedNft.nftType as keyof typeof nftMultipliers] || 1;
          const dailyYieldForNft = dailyYield(
            tierData.apr,
            nftMult,
            xp.xp
          );
          
          totalDailyYield += dailyYieldForNft;
          
          // Calculate accrued rewards
          const accrued = calculateAccrued(
            lockedNft.lockTimestamp,
            dailyYieldForNft
          );
          totalAccrued += accrued;
        });
        
        // Apply daily cap
        const cappedDailyYield = clampDaily(totalDailyYield);
        const perSecond = perSecondRate(cappedDailyYield);
        
        set({
          dailyYieldTotal: cappedDailyYield,
          perSecondRate: perSecond,
          rggpAccrued: totalAccrued
        });
      }
    }),
    {
      name: 'vault-store'
    }
  )
);
