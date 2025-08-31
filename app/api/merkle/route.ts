import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Merkle root from Merkleproof.txt
const MERKLE_ROOT = '0x49a63deb617700134f44436c90cdb063263653a450a86e62274d7d3ee3ebb43f';

// Path to merkleProofs.json (adjust if needed)
const proofsFilePath = path.join(process.cwd(), 'public', 'proof.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Valid address is required' });
  }

  try {
    // Read and parse the merkleProofs.json file
    const proofsData = fs.readFileSync(proofsFilePath, 'utf8');
    const proofs: { [address: string]: string[] } = JSON.parse(proofsData);

    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    const proof = proofs[normalizedAddress];

    if (!proof) {
      return res.status(403).json({ error: 'Address is not whitelisted' });
    }

    // Format proof as comma-separated string without brackets or quotes
    const formattedProof = proof.join(',');

    return res.status(200).json({
      proof: formattedProof,
      root: MERKLE_ROOT,
    });
  } catch (error) {
    console.error('Error reading proofs file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}