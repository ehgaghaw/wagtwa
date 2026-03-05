import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Connection } from "npm:@solana/web3.js@1.98.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RPC_URL = Deno.env.get("SOLANA_RPC_URL") || "https://api.mainnet-beta.solana.com";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body?.action;
    const connection = new Connection(RPC_URL, "confirmed");

    if (action === "getLatestBlockhash") {
      const latest = await connection.getLatestBlockhash("confirmed");
      return json({ blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight });
    }

    if (action === "sendRawTransaction") {
      const serialized = body?.serializedTransaction;
      if (!serialized || typeof serialized !== "string") {
        return json({ error: "serializedTransaction is required" }, 400);
      }

      const raw = Uint8Array.from(atob(serialized), (c) => c.charCodeAt(0));
      const signature = await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        maxRetries: 3,
      });

      try {
        await connection.confirmTransaction(signature, "confirmed");
      } catch {
        // Non-blocking: launch-token function will verify payment again on-chain
      }

      return json({ signature });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    return json({ error: (error as Error).message || "Relay error" }, 500);
  }
});
