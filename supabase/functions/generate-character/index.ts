import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COOLDOWN_SECONDS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { prompt, walletAddress, action } = await req.json();

    // Action: check — return current generation status for a wallet
    if (action === "check") {
      if (!walletAddress || typeof walletAddress !== "string") {
        return new Response(JSON.stringify({ error: "walletAddress is required" }), { status: 400, headers: jsonHeaders });
      }
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data } = await supabase
        .from("ai_generations")
        .select("generation_count, last_generated_at")
        .eq("wallet_address", walletAddress)
        .maybeSingle();

      const count = data?.generation_count ?? 0;
      const lastGen = data?.last_generated_at ? new Date(data.last_generated_at).getTime() : 0;
      const cooldownRemaining = Math.max(0, COOLDOWN_SECONDS - Math.floor((Date.now() - lastGen) / 1000));

      return new Response(JSON.stringify({
        generationCount: count,
        cooldownRemaining,
      }), { headers: jsonHeaders });
    }

    // Action: generate
    if (!walletAddress || typeof walletAddress !== "string") {
      return new Response(JSON.stringify({ error: "walletAddress is required" }), { status: 400, headers: jsonHeaders });
    }
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400, headers: jsonHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get or create generation record
    let { data: record } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (!record) {
      const { data: newRecord, error: insertErr } = await supabase
        .from("ai_generations")
        .insert({ wallet_address: walletAddress, generation_count: 0 })
        .select()
        .single();
      if (insertErr) throw insertErr;
      record = newRecord;
    }

    // Check cooldown
    if (record.last_generated_at) {
      const elapsed = (Date.now() - new Date(record.last_generated_at).getTime()) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - elapsed);
        return new Response(JSON.stringify({
          error: "Cooldown active",
          cooldownRemaining: remaining,
        }), { status: 429, headers: jsonHeaders });
      }
    }

    // Call OpenAI
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), { status: 500, headers: jsonHeaders });
    }

    const fullPrompt = `A brainrot meme character: ${prompt.trim()}. The character must be drawn in a simple, bold, cartoonish style similar to internet meme characters and shitpost art. Flat colors, thick outlines, exaggerated proportions, goofy expression, absurd and unhinged energy. The character should look like it belongs on a crypto memecoin. White background. Single character only, centered, no text, no watermarks.`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: fullPrompt,
        n: 1,
        size: "1024x1024",
        quality: "low",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Image generation failed", details: errorText }), { status: response.status, headers: jsonHeaders });
    }

    const data = await response.json();
    const imageBase64 = data.data?.[0]?.b64_json;
    const imageUrl = data.data?.[0]?.url;
    const resultUrl = imageUrl || (imageBase64 ? `data:image/png;base64,${imageBase64}` : null);

    if (!resultUrl) {
      return new Response(JSON.stringify({ error: "No image returned from API" }), { status: 500, headers: jsonHeaders });
    }

    // Increment generation count
    const { error: updateErr } = await supabase
      .from("ai_generations")
      .update({
        generation_count: record.generation_count + 1,
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress);

    if (updateErr) console.error("Failed to update generation count:", updateErr);

    const newCount = record.generation_count + 1;

    return new Response(JSON.stringify({
      imageUrl: resultUrl,
      generationCount: newCount,
    }), { headers: jsonHeaders });
  } catch (e) {
    console.error("generate-character error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
