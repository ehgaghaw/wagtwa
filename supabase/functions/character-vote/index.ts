import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { characterId, voteType, walletAddress } = await req.json();

    if (!characterId || typeof characterId !== "string") {
      return new Response(JSON.stringify({ error: "characterId is required" }), { status: 400, headers: jsonHeaders });
    }

    if (voteType !== "up" && voteType !== "down") {
      return new Response(JSON.stringify({ error: "voteType must be 'up' or 'down'" }), { status: 400, headers: jsonHeaders });
    }

    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!walletAddress || typeof walletAddress !== "string" || !base58Regex.test(walletAddress)) {
      return new Response(JSON.stringify({ error: "Valid walletAddress is required" }), { status: 400, headers: jsonHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existingVote, error: existingVoteError } = await supabase
      .from("character_votes")
      .select("id, vote_type")
      .eq("character_id", characterId)
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (existingVoteError) {
      throw existingVoteError;
    }

    let action: "inserted" | "updated" | "removed" = "inserted";

    if (existingVote && existingVote.vote_type === voteType) {
      const { error } = await supabase.from("character_votes").delete().eq("id", existingVote.id);
      if (error) throw error;
      action = "removed";
    } else if (existingVote) {
      const { error } = await supabase
        .from("character_votes")
        .update({ vote_type: voteType })
        .eq("id", existingVote.id);
      if (error) throw error;
      action = "updated";
    } else {
      const { error } = await supabase.from("character_votes").insert({
        character_id: characterId,
        wallet_address: walletAddress,
        vote_type: voteType,
      });
      if (error) throw error;
      action = "inserted";
    }

    const { data: votes, error: votesError } = await supabase
      .from("character_votes")
      .select("vote_type")
      .eq("character_id", characterId);

    if (votesError) {
      throw votesError;
    }

    const up = votes?.filter((vote) => vote.vote_type === "up").length ?? 0;
    const down = votes?.filter((vote) => vote.vote_type === "down").length ?? 0;

    return new Response(
      JSON.stringify({
        success: true,
        action,
        voteCounts: { up, down },
      }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (error) {
    console.error("character-vote error", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
