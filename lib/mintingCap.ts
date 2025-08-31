import { getContract, readContract } from "thirdweb";

// Define the Thirdweb contract type
type ThirdwebContract = ReturnType<typeof getContract>;

// Minting caps for each NFT type (global across all chains)
export const MINTING_CAPS = {
  seed: {
    totalSupply: 600, // Total: 600 (Whitelist: 200, Public: 400, Agent: 0)
    whitelistSupply: 200, // Total whitelist cap
  },
  tree: {
    totalSupply: 300, // Total: 300 (Whitelist: 100, Public: 200, Agent: 0)
    whitelistSupply: 100, // Total whitelist cap
  },
  solar: {
    totalSupply: 300, // Not available for minting
    whitelistSupply: 0,
  },
  compute: {
    totalSupply: 99, // Not available for minting
    whitelistSupply: 0,
  },
} as const;

type NftType = keyof typeof MINTING_CAPS;

// Check if minting is allowed based on whitelist supply
export async function canMintNFT({
  nftContract,
  nftType,
  quantity,
}: {
  nftContract: ThirdwebContract;
  nftType: NftType;
  quantity: number;
}): Promise<{ allowed: boolean; message: string }> {
  try {
    // Restrict minting to SeedPass and TreePass
    if (nftType !== 'seed' && nftType !== 'tree') {
      return {
        allowed: false,
        message: `Minting not available for ${nftType} at this time`,
      };
    }

    // Get total supply from contract
    const totalSupply = await readContract({
      contract: nftContract,
      method: "totalSupply",
      params: [],
    });
    const totalMinted = Number(totalSupply.toString());
    const whitelistSupply = MINTING_CAPS[nftType].whitelistSupply;

    // Check whitelist supply cap
    if (totalMinted + quantity > whitelistSupply) {
      return {
        allowed: false,
        message: `Whitelist supply cap exceeded: ${totalMinted}/${whitelistSupply} already minted for ${nftType}`,
      };
    }

    return { allowed: true, message: 'Minting allowed' };
  } catch (error) {
    console.error('Error checking minting caps:', error);
    return { allowed: false, message: `Error: ${(error as Error).message}` };
  }
}