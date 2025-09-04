// app/api/merkle-proof/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { MerkleTree } from "merkletreejs";
import { isAddress, solidityPackedKeccak256, keccak256 as keccak256Hex } from "ethers";

/** ================= Config ================= **/
/**
 * Put Whitelist.csv at project root by default.
 * You can override path via WL_CSV_PATH (absolute or relative).
 * Adjust cache TTL with WL_CACHE_TTL_MS (ms). Default 5 minutes.
 */
const WL_CSV_PATH = process.env.WL_CSV_PATH || "Whitelist.csv";
const WL_CACHE_TTL_MS = Number(process.env.WL_CACHE_TTL_MS || 5 * 60 * 1000);

/** ================= Helpers ================= **/
function keccak256Buf(data: Buffer) {
  // merkletreejs wants a Buffer-based keccak
  return Buffer.from(keccak256Hex(data).slice(2), "hex");
}

async function resolveCsvPath(): Promise<string> {
  const cwd = process.cwd();
  const candidates = [
    path.isAbsolute(WL_CSV_PATH) ? WL_CSV_PATH : path.join(cwd, WL_CSV_PATH),
    path.join(cwd, "Whitelist.csv"),
    path.join(cwd, "public", "Whitelist.csv"),
  ];
  for (const p of candidates) {
    try {
      const st = await fs.stat(p);
      if (st.isFile()) return p;
    } catch {}
  }
  throw new Error(
    `Whitelist CSV not found. Looked for:\n` + candidates.map(c => ` - ${c}`).join("\n")
  );
}

/** Parse CSV -> lowercase addresses (first column), remove quotes, validate */
function parseAddressesFromCsv(content: string): string[] {
  const lines = content.split(/\r?\n/);

  const raw = lines
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"))
    .map(l => (l.split(",")[0] || "").trim().replace(/^["']|["']$/g, ""))
    .map(a => a.toLowerCase())
    .filter(a => !!a && isAddress(a));

  // dedupe (case-insensitive; all are lower already) and sort
  const set = new Set(raw);
  const list = Array.from(set);
  list.sort();
  return list;
}

/** ================= Cache ================= **/
let cache:
  | {
      at: number;
      lcAddresses: string[];           // lowercased, sorted
      tree: MerkleTree;
      root: string;
      lcSet: Set<string>;
    }
  | null = null;

async function getTree() {
  const now = Date.now();
  if (!cache || now - cache.at > WL_CACHE_TTL_MS) {
    const csvPath = await resolveCsvPath();
    const csv = await fs.readFile(csvPath, "utf8");
    const lcAddresses = parseAddressesFromCsv(csv);

    // EXACT leaf generation as your script:
    // Buffer.from(ethers.solidityPackedKeccak256(['address'], [addr]).slice(2), 'hex')
    const leaves = lcAddresses.map(addr =>
      Buffer.from(solidityPackedKeccak256(["address"], [addr]).slice(2), "hex")
    );

    const tree = new MerkleTree(leaves, keccak256Buf, {
      sortLeaves: true,
      sortPairs: true,
      duplicateOdd: false,
    });

    const root = "0x" + tree.getRoot().toString("hex");
    const lcSet = new Set(lcAddresses);
    cache = { at: now, lcAddresses, tree, root, lcSet };
  }
  return cache;
}

/** ================= Handler ================= **/
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const addrParam = (url.searchParams.get("address") || "").trim();

  // validate & normalize to lowercase (to mirror the script data)
  if (!isAddress(addrParam)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }
  const addressLc = addrParam.toLowerCase();

  try {
    const { lcSet, tree, root } = await getTree();

    if (!lcSet.has(addressLc)) {
      return NextResponse.json({ whitelisted: false, root, proof: [] }, { status: 404 });
    }

    // EXACT proof generation as your script:
    const leafBuf = Buffer.from(
      solidityPackedKeccak256(["address"], [addressLc]).slice(2),
      "hex"
    );
    const proof = tree.getProof(leafBuf).map(p => "0x" + p.data.toString("hex"));

    return NextResponse.json({
      whitelisted: true,
      address: addressLc, // lowercased, same as input set/script
      root,
      proof,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Server error. Ensure Whitelist.csv exists (or WL_CSV_PATH is set) and contains valid addresses.",
      },
      { status: 500 }
    );
  }
}
