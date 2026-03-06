import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Connection, Keypair, VersionedTransaction } from "npm:@solana/web3.js@1.98.4";
import bs58 from "npm:bs58@6.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRADE_API = "https://pumpportal.fun/api/trade-local";
const IPFS_API = "https://pump.fun/api/ipfs";
const RPC_URL = Deno.env.get("SOLANA_RPC_URL") || "https://api.mainnet-beta.solana.com";

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseSecretKey(secret: string): Uint8Array {
  const value = secret.trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    return Uint8Array.from(JSON.parse(value));
  }
  if (value.includes(",")) {
    return Uint8Array.from(value.split(",").map((n) => Number(n.trim())));
  }
  return bs58.decode(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let launchId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const walletPrivateKey = Deno.env.get("PROXY_WALLET_PRIVATE_KEY");

    if (!walletPrivateKey) {
      return errorResponse("Wallet private key not configured", 500);
    }

    const body = await req.json();
    const {
      userWallet,
      tokenName,
      tokenSymbol,
      tokenDescription,
      tokenImageUrl,
      devBuyAmount,
      universe,
      twitter,
      telegram,
      website,
    } = body;

    if (!tokenName || !tokenSymbol) {
      return errorResponse("Missing required fields: tokenName and tokenSymbol", 400);
    }

    const initialBuySol = Math.max(0, Number(devBuyAmount ?? 0));
    const walletKeypair = Keypair.fromSecretKey(parseSecretKey(walletPrivateKey));
    const walletAddress = walletKeypair.publicKey.toBase58();
    const connection = new Connection(RPC_URL, "confirmed");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create pending record
    const { data: row, error: insertError } = await supabase
      .from("token_launches")
      .insert({
        user_wallet: userWallet || "anonymous",
        token_name: tokenName,
        token_symbol: tokenSymbol,
        token_description: tokenDescription || "",
        token_image_url: tokenImageUrl || "",
        sol_amount: initialBuySol,
        status: "pending",
        universe: universe || "Italian Brainrot",
        twitter: twitter || null,
        telegram: telegram || null,
        website: website || null,
      })
      .select("id")
      .single();

    if (insertError || !row) {
      return errorResponse("Failed to create launch record: " + (insertError?.message || "Unknown"), 500);
    }
    launchId = row.id;

    // Upload to IPFS
    let metadataUri = "";
    if (tokenImageUrl) {
      const imageRes = await fetch(tokenImageUrl);
      if (!imageRes.ok) {
        await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
        return errorResponse("Could not fetch token image", 400);
      }

      const imageBlob = await imageRes.blob();
      const formData = new FormData();
      formData.append("file", imageBlob, "token-image.png");
      formData.append("name", tokenName);
      formData.append("symbol", tokenSymbol);
      formData.append("description", tokenDescription || "");
      formData.append("showName", "true");
      if (twitter) formData.append("twitter", twitter);
      if (telegram) formData.append("telegram", telegram);
      if (website) formData.append("website", website);

      const ipfsRes = await fetch(IPFS_API, { method: "POST", body: formData });
      if (!ipfsRes.ok) {
        const errText = await ipfsRes.text();
        await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
        return errorResponse("IPFS upload failed: " + errText, 500);
      }

      const ipfsData = await ipfsRes.json();
      metadataUri = ipfsData?.metadataUri;
      if (!metadataUri) {
        await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
        return errorResponse("IPFS returned no metadata URI", 500);
      }
    }

    // Generate mint keypair
    const mintKeypair = Keypair.generate();

    // Create token via PumpPortal
    const tradePayload = {
      publicKey: walletAddress,
      action: "create",
      tokenMetadata: {
        name: tokenName,
        symbol: tokenSymbol,
        uri: metadataUri,
      },
      mint: mintKeypair.publicKey.toBase58(),
      denominatedInSol: "true",
      amount: initialBuySol,
      slippage: 10,
      priorityFee: 0.0005,
      pool: "pump",
    };

    const tradeRes = await fetch(TRADE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tradePayload),
    });

    if (tradeRes.status !== 200) {
      const errText = await tradeRes.text();
      await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
      return errorResponse("PumpPortal create failed: " + errText, 500);
    }

    // Sign and send
    const txBytes = new Uint8Array(await tradeRes.arrayBuffer());
    const tx = VersionedTransaction.deserialize(txBytes);
    tx.sign([mintKeypair, walletKeypair]);

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction(signature, "confirmed");

    // Update record
    const mintAddress = mintKeypair.publicKey.toBase58();
    await supabase
      .from("token_launches")
      .update({
        status: "completed",
        mint_address: mintAddress,
        transaction_signature: signature,
      })
      .eq("id", launchId);

    // Also save to launched_coins for the explore/ticker feeds
    await supabase.from("launched_coins").insert({
      wallet_address: userWallet || "anonymous",
      name: tokenName,
      ticker: tokenSymbol,
      description: tokenDescription || "",
      image_url: tokenImageUrl || null,
      universe: universe || "Italian Brainrot",
      mint_address: mintAddress,
      signature: signature,
      initial_buy: initialBuySol,
      twitter: twitter || null,
      telegram: telegram || null,
      website: website || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        launchId,
        mintAddress: mintKeypair.publicKey.toBase58(),
        transactionSignature: signature,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    if (launchId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
      } catch { /* ignore */ }
    }
    return errorResponse((err as Error)?.message || "Launch failed", 500);
  }
});
