import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRADE_API = "https://pumpportal.fun/api/trade-local";
const IPFS_API = "https://pump.fun/api/ipfs";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action"); // "ipfs" or "trade"

    if (action === "ipfs") {
      // Forward the multipart form data to pump.fun IPFS
      const formData = await req.formData();
      const res = await fetch(IPFS_API, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        return new Response(JSON.stringify({ error: `IPFS upload failed: ${text}` }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "trade") {
      // Forward JSON body to PumpPortal trade API
      const body = await req.json();
      const res = await fetch(TRADE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status !== 200) {
        const text = await res.text();
        return new Response(JSON.stringify({ error: `Trade API failed: ${text}` }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return the raw transaction bytes
      const txData = await res.arrayBuffer();
      return new Response(txData, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/octet-stream",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use ?action=ipfs or ?action=trade" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
