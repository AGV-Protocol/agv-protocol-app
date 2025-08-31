import { MerkleTree } from 'merkletreejs';
import { ethers } from 'ethers';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Google Sheet configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1vbPHAJbMF-qinDM4G06T9PbixBhja-pKehDghuaIx-4';
const RANGE = 'Sheet1!S2:S'; // Column S, starting from row 2

// Cache for Merkle tree and whitelist hash
let cachedTree: MerkleTree | null = null;
let cachedWhitelistHash: string | null = null;

// Keccak256 function for Merkle tree
function keccak256(data: string | Buffer): Buffer {
  return Buffer.from(ethers.utils.keccak256(data).slice(2), 'hex');
}

// Fetch whitelist from Google Sheet and compute hash
async function fetchWhitelist(): Promise<{ addresses: string[]; hash: string }> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    const addresses = (response.data.values || [])
      .flat()
      .map((addr: string) => addr.trim())
      .filter((addr: string) => ethers.utils.isAddress(addr))
      .map((addr: string) => ethers.utils.getAddress(addr)) // Normalize addresses
      .sort(); // Sort for Merkle tree consistency
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(addresses.join(',')));
    return { addresses, hash };
  } catch (error) {
    console.error('Error fetching whitelist from Google Sheet:', error);
    throw new Error('Failed to fetch whitelist');
  }
}

// Check if wallet is in the Google Sheet
async function isWalletInSheet(address: string): Promise<boolean> {
  try {
    const normalizedAddress = ethers.utils.getAddress(address).toLowerCase();
    const { addresses } = await fetchWhitelist();
    return addresses.includes(normalizedAddress);
  } catch (error) {
    console.error('Error verifying wallet in Google Sheet:', error);
    throw new Error('Failed to verify wallet');
  }
}

// Generate or retrieve cached Merkle tree
async function getMerkleTree(): Promise<MerkleTree> {
  const { addresses, hash } = await fetchWhitelist();
  
  // Rebuild tree only if whitelist has changed
  if (cachedTree && cachedWhitelistHash === hash) {
    return cachedTree;
  }

  const leaves = addresses.map((addr) =>
    Buffer.from(ethers.utils.solidityKeccak256(['address'], [addr]).slice(2), 'hex')
  );
  cachedTree = new MerkleTree(leaves, keccak256, {
    sortLeaves: true,
    sortPairs: true,
    duplicateOdd: false,
  });
  cachedWhitelistHash = hash;
  return cachedTree;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const contract = searchParams.get('contract'); // Unused, kept for extensibility

    // Validate address
    if (!address || !ethers.utils.isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    // Normalize and verify address
    const normalizedAddress = ethers.utils.getAddress(address);
    const isWhitelisted = await isWalletInSheet(normalizedAddress);
    if (!isWhitelisted) {
      return NextResponse.json({ error: 'Address not whitelisted' }, { status: 403 });
    }

    // Generate proof
    const tree = await getMerkleTree();
    const leafHex = ethers.utils.solidityKeccak256(['address'], [normalizedAddress]);
    const leafBuffer = Buffer.from(leafHex.slice(2), 'hex');
    const proofBuffers = tree.getProof(leafBuffer);
    const proof = proofBuffers.map((p) => '0x' + p.data.toString('hex'));

    return NextResponse.json({ proof });
  } catch (error) {
    console.error('Merkle API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}