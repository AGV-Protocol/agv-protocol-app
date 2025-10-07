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

export interface VaultState {
  // Wallet and tier selection
  wallet?: `0x${string}`;
  tier: LockTier;
  
  // Data
  xp?: XpData;
  tiers?: TiersData;
  positions: Array<{ type: NftType; start_ts: number; lock_tier?: string }>;
  leaderboard?: LeaderboardData;
  
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
      xp: undefined,
      tiers: undefined,
      positions: [],
      leaderboard: undefined,
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
        const { tier, xp, tiers, positions } = get();
        
        if (!tiers || !xp) return;

        const tierData = tiers.tiers[tier];
        const nftMultipliers = tiers.nftMultipliers;
        
        let totalDailyYield = 0;
        let totalAccrued = 0;
        
        positions.forEach(position => {
          const nftMult = nftMultipliers[position.type];
          const dailyYieldForNft = dailyYield(
            tierData.apr,
            nftMult,
            xp.xp
          );
          
          totalDailyYield += dailyYieldForNft;
          
          // Calculate accrued rewards
          const accrued = calculateAccrued(
            position.start_ts,
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
