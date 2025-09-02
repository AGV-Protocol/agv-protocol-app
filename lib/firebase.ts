// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize exactly once (Next.js SSR/CSR safe)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// SDK instances
export const db = getFirestore(app);
export const auth = getAuth(app);

// Persist auth in the browser (no-op on server)
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // ignore persistence errors (e.g., Safari ITP)
  });
}

// Optional: emulator support (set these envs only in local dev)
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  if (typeof window !== "undefined") {
    try {
      connectAuthEmulator(auth, process.env.NEXT_PUBLIC_AUTH_EMULATOR_URL || "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(
        db,
        process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST?.split(":")?.[0] || "127.0.0.1",
        Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST?.split(":")?.[1] || 8080)
      );
      // Tip: set
      // NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
      // NEXT_PUBLIC_AUTH_EMULATOR_URL=http://127.0.0.1:9099
      // NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
    } catch {
      // already connected / not available — safe to ignore
    }
  }
}
