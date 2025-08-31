import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Merkle root from Merkleproof.txt
const MERKLE_ROOT = '0x49a63deb617700134f44436c90cdb063263653a450a86e62274d7d3ee3ebb43f';

// Path to proof.json (ensure it exists in the public directory)
const proofsFilePath = path.join(process.cwd(), 'public', 'proof.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' ? 'https://your-project.vercel.app' : '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-client-id');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log(`Method not allowed: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed', method: req.method });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ error: 'Valid Ethereum address is required', address });
  }

  try {
    // Verify file exists
    if (!fs.existsSync(proofsFilePath)) {
      console.error('Proof file not found:', proofsFilePath);
      return res.status(500).json({ error: 'Proof file not found', path: proofsFilePath });
    }

    // Read and parse the proof.json file
    const proofsData = fs.readFileSync(proofsFilePath, 'utf8');
    let proofs: { [address: string]: string[] };
    try {
      proofs = JSON.parse(proofsData);
    } catch (parseError) {
      console.error('Error parsing proof.json:', parseError);
      return res.status(500).json({ error: 'Invalid proof file format', details: Error });
    }

    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    const proof = proofs[normalizedAddress];

    if (!proof) {
      return res.status(403).json({ error: 'Address is not whitelisted', address: normalizedAddress });
    }

    // Format proof as comma-separated string without brackets or quotes
    const formattedProof = proof.join(',');

    return res.status(200).json({
      proof: formattedProof,
      root: MERKLE_ROOT,
    });
  } catch (error) {
    console.error('Error processing Merkle proof request:', error);
    return res.status(500).json({ error: 'Internal server error', details: Error });
  }
}
