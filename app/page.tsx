// app/page.tsx (Server Component)
import { Suspense } from "react";
// If your mint UI lives in a client component file:
import MintingContent from "./MintingContent"; // adjust path if needed

export default function Page() {
  return (
    <main>
      <Suspense
        fallback={
          <div style={{minHeight:"100vh",display:"grid",placeItems:"center"}}>
            Loading…
          </div>
        }
      >
        <MintingContent />
      </Suspense>
    </main>
  );
}
