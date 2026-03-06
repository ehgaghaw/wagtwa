import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Connection, Keypair, PublicKey, VersionedTransaction } from "npm:@solana/web3.js@1.98.4";
import bs58 from "npm:bs58@6.0.0";
import nacl from "npm:tweetnacl@1.0.3";

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

function decodeBase64Bytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function verifyLaunchAuthSignature(input: {
  userWallet: string;
  launchAuthMessage: string;
  launchAuthSignature: string;
}): boolean {
  const { userWallet, launchAuthMessage, launchAuthSignature } = input;

  if (!launchAuthMessage.startsWith("ROT_LAUNCH:")) return false;

  const parts = launchAuthMessage.split(":");
  if (parts.length !== 4) return false;

  const messageWallet = parts[1];
  const timestamp = Number(parts[3]);

  if (messageWallet !== userWallet) return false;
  if (!Number.isFinite(timestamp)) return false;

  const now = Date.now();
  const maxSkewMs = 5 * 60 * 1000;
  if (Math.abs(now - timestamp) > maxSkewMs) return false;

  const messageBytes = new TextEncoder().encode(launchAuthMessage);
  const signatureBytes = decodeBase64Bytes(launchAuthSignature);
  const publicKeyBytes = new PublicKey(userWallet).toBytes();

  return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
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
      launchAuthMessage,
      launchAuthSignature,
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

    if (!tokenName || typeof tokenName !== "string" || tokenName.trim().length === 0 || tokenName.length > 50) {
      return errorResponse("Invalid tokenName: required, max 50 chars", 400);
    }
    if (!tokenSymbol || typeof tokenSymbol !== "string" || tokenSymbol.trim().length === 0 || tokenSymbol.length > 10) {
      return errorResponse("Invalid tokenSymbol: required, max 10 chars", 400);
    }

    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!userWallet || typeof userWallet !== "string" || !base58Regex.test(userWallet)) {
      return errorResponse("Invalid userWallet address", 400);
    }
    if (!launchAuthMessage || typeof launchAuthMessage !== "string") {
      return errorResponse("launchAuthMessage is required", 400);
    }
    if (!launchAuthSignature || typeof launchAuthSignature !== "string") {
      return errorResponse("launchAuthSignature is required", 400);
    }

    const hasValidSignature = verifyLaunchAuthSignature({
      userWallet,
      launchAuthMessage,
      launchAuthSignature,
    });

    if (!hasValidSignature) {
      return errorResponse("Unauthorized launch request", 401);
    }

    const MAX_DEV_BUY_SOL = 5;
    const rawBuy = Number(devBuyAmount ?? 0);
    if (isNaN(rawBuy) || rawBuy < 0) {
      return errorResponse("Invalid devBuyAmount", 400);
    }

    const initialBuySol = Math.min(MAX_DEV_BUY_SOL, Math.max(0, rawBuy));
    const walletKeypair = Keypair.fromSecretKey(parseSecretKey(walletPrivateKey));
    const walletAddress = walletKeypair.publicKey.toBase58();
    const connection = new Connection(RPC_URL, "confirmed");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: hourlyLaunchCount }, { count: dailyLaunchCount }] = await Promise.all([
      supabase
        .from("token_launches")
        .select("id", { count: "exact", head: true })
        .eq("user_wallet", userWallet)
        .gte("created_at", oneHourAgo),
      supabase
        .from("token_launches")
        .select("id", { count: "exact", head: true })
        .eq("user_wallet", userWallet)
        .gte("created_at", dayAgo),
    ]);

    if ((hourlyLaunchCount ?? 0) >= 3) {
      return errorResponse("Rate limit exceeded: max 3 launches per hour", 429);
    }

    if ((dailyLaunchCount ?? 0) >= 10) {
      return errorResponse("Rate limit exceeded: max 10 launches per day", 429);
    }

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
