// app/api/wallet-nfts/route.ts
import { NextRequest, NextResponse } from "next/server";
import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { ensureMoralisStarted } from "@/lib/moralisServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toGateway(u?: string | null) {
  if (!u) return undefined;
  if (u.startsWith("ipfs://")) return u.replace(/^ipfs:\/\//, "https://ipfscdn.io/ipfs/");
  return u.replace(/^https?:\/\/ipfs\.io\/ipfs\//i, "https://ipfscdn.io/ipfs/");
}

function toChainArg(raw: string) {
  // Accepts "0x38", "56", "137", "42161", or names like "ethereum"
  if (!raw) throw new Error("Missing chain");
  if (/^0x[0-9a-fA-F]+$/.test(raw)) return raw as `0x${string}`;
  const n = Number(raw);
  if (!Number.isNaN(n)) return n; // EvmChain.create accepts number chain IDs
  return raw; // fallback: name ("ethereum", "polygon", etc.)
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.MORALIS_API_KEY) {
      return NextResponse.json({ error: "MORALIS_API_KEY not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const address = (searchParams.get("address") || "").trim();
    const chainParam = (searchParams.get("chain") || "").trim(); // e.g. "0x38" or "56"

    if (!address) return NextResponse.json({ error: "Missing address" }, { status: 400 });
    if (!chainParam) return NextResponse.json({ error: "Missing chain" }, { status: 400 });

    await ensureMoralisStarted();

    const chain = EvmChain.create(toChainArg(chainParam));

    const res = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain,
      normalizeMetadata: true, // get normalized metadata.image
    });

    const json = res.toJSON();
    const items = (json?.result || []).map((it: any) => {
      const img =
        it?.normalized_metadata?.image ??
        it?.metadata?.image ??
        it?.media?.media_collection?.high?.url ??
        it?.media?.original_media_url ??
        it?.media?.media_collection?.low?.url ??
        null;

      return {
        tokenAddress: (it?.token_address || "").toLowerCase(),
        tokenIdStr: String(it?.token_id ?? ""),
        contractType: it?.contract_type || "ERC721",
        name: it?.normalized_metadata?.name ?? it?.name ?? null,
        imageUrl: toGateway(img),
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
