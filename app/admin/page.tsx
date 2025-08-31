"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ethers } from "ethers";

export default function Admin() {
  const [kolId, setKolId] = useState("");
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [link, setLink] = useState("");

  const generateLink = async () => {
    if (!kolId || !walletAddress || !ethers.utils.isAddress(walletAddress)) {
      alert("Invalid KOL ID or wallet address");
      return;
    }
    try {
      await addDoc(collection(db, "kols"), {
        kolId,
        name,
        walletAddress,
        createdAt: new Date(),
      });
      const referralLink = `${window.location.origin}/mint?kolId=${kolId}`;
      setLink(referralLink);
    } catch (error) {
      console.error("Error saving KOL:", error);
      alert("Failed to generate link");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">KOL Link Generator</h1>
      <div className="space-y-4">
        <Input
          placeholder="KOL ID (e.g., kol123)"
          value={kolId}
          onChange={(e) => setKolId(e.target.value)}
        />
        <Input
          placeholder="KOL Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
        <Button onClick={generateLink}>Generate Link</Button>
        {link && (
          <div>
            <p>Referral Link: <a href={link} className="text-blue-600">{link}</a></p>
          </div>
        )}
      </div>
    </div>
  );
}
