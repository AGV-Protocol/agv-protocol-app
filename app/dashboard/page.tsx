"use client";

import { useEffect, useState } from "react";
import { ThirdwebProvider, useSDK } from "@thirdweb-dev/react";
import { ChainId, Binance, Polygon, Arbitrum } from "@thirdweb-dev/chains";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CHAINS, NFT_CONTRACTS, CLIENT_ID } from "@/lib/contracts";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import ChartAreaInteractive from "@/components/ChartAreaInteractive";

function DashboardContent() {
  const sdk = useSDK();
  const [kols, setKols] = useState<any[]>([]);
  const [mintingTrends, setMintingTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sdk) {
      setError("SDK not initialized");
      setLoading(false);
      return;
    }

    const fetchKols = async () => {
      try {
        setLoading(true);
        const kolsCollection = collection(db, "kols");
        const kolsSnapshot = await getDocs(kolsCollection);
        const kolsData = await Promise.all(
          kolsSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const { address } = data;

            // Fetch Hawkins score
            const hawkinsRes = await fetch(`/api/hawkins?address=${address}`);
            if (!hawkinsRes.ok) throw new Error("Failed to fetch Hawkins score");
            const { score } = await hawkinsRes.json();

            // Fetch minted NFTs using sdk.getContract
            let totalMinted = 0;
            for (const type of Object.keys(NFT_CONTRACTS) as Array<keyof typeof NFT_CONTRACTS>) {
              for (const chainId of Object.keys(CHAINS) as Array<keyof typeof CHAINS>) {
                const addr = NFT_CONTRACTS[type][chainId];
                if (addr) {
                  console.log(`Fetching balance for ${type} on chain ${chainId} at ${addr}`);
                  const contract = await sdk.getContract(addr, "nft-collection");
                  const balance = await contract.call("balanceOf", [address]).catch((e) => {
                    console.error(`Balance fetch failed for ${addr}:`, e);
                    return 0;
                  });
                  totalMinted += Number(balance || 0);
                }
              }
            }

            return { ...data, hawkinsScore: score || 0, mintedNfts: totalMinted };
          })
        );

        setKols(kolsData.sort((a, b) => b.hawkinsScore - a.hawkinsScore));
      } catch (err) {
        console.error("Error fetching KOLs:", err);
        setError("Failed to load KOL data");
      } finally {
        setLoading(false);
      }
    };

    const fetchMintingTrends = async () => {
      try {
        setLoading(true);
        const trends: any[] = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        for (let i = 0; i < 30; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);

          let dailyMints = 0;
          for (const type of Object.keys(NFT_CONTRACTS)) {
            for (const chainId of Object.keys(CHAINS)) {
              const addr = (NFT_CONTRACTS as Record<string, Record<string, string>>)[type][chainId];
              if (addr) {
                console.log(`Fetching events for ${type} on chain ${chainId} at ${addr}`);
                const contract = await sdk.getContract(addr, "nft-collection");
                const events = await contract.events
                  .getEvents("Transfer", {
                    filters: {
                      blockTimestamp: { gte: Math.floor(date.getTime() / 1000) },
                    },
                  })
                  .catch((e) => {
                    console.error(`Event fetch failed for ${addr}:`, e);
                    return [];
                  });
                dailyMints += events?.length || 0;
              }
            }
          }

          trends.push({
            date: date.toISOString().split("T")[0],
            minted: dailyMints,
          });
        }

        setMintingTrends(trends);
      } catch (err) {
        console.error("Error fetching minting trends:", err);
        setError("Failed to load minting trends");
      } finally {
        setLoading(false);
      }
    };

    fetchKols();
    fetchMintingTrends();
  }, [sdk]);

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">KOL Dashboard</h1>

      {/* Leaderboard */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Hawkins Score</TableHead>
            <TableHead>Minted NFTs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kols.map((kol) => (
            <TableRow key={kol.wallet}>
              <TableCell>
                <Link href={`/profile/${kol.wallet}`} className="text-primary">
                  {kol.username}
                </Link>
              </TableCell>
              <TableCell>
                {kol.wallet.slice(0, 6)}...{kol.wallet.slice(-4)}
              </TableCell>
              <TableCell>{kol.hawkinsScore}</TableCell>
              <TableCell>{kol.mintedNfts}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Area Chart for Minting Trends */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Minting Trends (Last 30 Days)</h2>
        <ChartAreaInteractive data={mintingTrends} />
      </div>

      {/* Bar Chart for Hawkins Score vs Minted NFTs */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">KOL Metrics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={kols}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="username" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="hawkinsScore" fill="#2563eb" name="Hawkins Score" />
            <Bar dataKey="mintedNfts" fill="#000000" name="Minted NFTs" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Link href="/profile/[wallet]" className="mt-4 inline-block text-primary">
        View your Profile
      </Link>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ThirdwebProvider clientId={CLIENT_ID} supportedChains={[Binance, Polygon, Arbitrum]}>
      <DashboardContent />
    </ThirdwebProvider>
  );
}