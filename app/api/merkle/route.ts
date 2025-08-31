import { ethers } from "ethers";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WHITELIST_FILE = path.join(process.cwd(), "Merkleproof.txt");

interface WhitelistData {
  merkleRoot: string;
  proofs: Record<string, string[]>; // address → proof[]
}

// Parse the TXT file into usable data
function loadWhitelist(): WhitelistData {
  const fileContent = fs.readFileSync(WHITELIST_FILE, "utf-8");

  const lines = fileContent.split(/\r?\n/).map((l) => l.trim());
  let merkleRoot = "";
  const proofs: Record<string, string[]> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("Merkle Root:")) {
      merkleRoot = line.replace("Merkle Root:", "").trim();
    }

    if (line.startsWith("Address:")) {
      const address = ethers.utils.getAddress(
        line.replace("Address:", "").trim()
      );

      const proofLine = lines[i + 1] || "";
      if (proofLine.startsWith("Proof:")) {
        try {
          const proof = JSON.parse(
            proofLine.replace("Proof:", "").trim()
          ) as string[];
          proofs[address] = proof;
        } catch (err) {
          console.error("Failed to parse proof for", address, err);
          proofs[address] = []; // fallback empty
        }
      } else {
        proofs[address] = []; // no proof line
      }
    }
  }

  return { merkleRoot, proofs };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address || !ethers.utils.isAddress(address)) {
      return new NextResponse("Invalid address", { status: 400 });
    }

    const normalizedAddress = ethers.utils.getAddress(address);
    const { proofs } = loadWhitelist();

    // return empty string if no proof found
    const proofArray = proofs[normalizedAddress] || [];
    const proofString = proofArray.length > 0 ? proofArray.join(",") : "";

    return new NextResponse(proofString, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Merkle API error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
