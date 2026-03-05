import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

function parseProxySecretKey(secret: string): Uint8Array {
  const value = secret.trim();

  if (value.startsWith("[") && value.endsWith("]")) {
    const arr = JSON.parse(value);
    return Uint8Array.from(arr);
  }

  if (value.includes(",")) {
    return Uint8Array.from(value.split(",").map((n) => Number(n.trim())));
  }

  return bs58.decode(value);
}

async function verifyPaymentReceived(
  connection: Connection,
  paymentSignature: string,
  proxyWalletAddress: string,
  minLamports: number,
): Promise<boolean> {
  const tx = await connection.getParsedTransaction(paymentSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!tx || tx.meta?.err) return false;

  for (const instruction of tx.transaction.message.instructions as any[]) {
    if (
      instruction?.program === "system" &&
      instruction?.parsed?.type === "transfer"
    ) {
      const destination = instruction.parsed?.info?.destination;
      const lamports = Number(instruction.parsed?.info?.lamports || 0);
      if (destination === proxyWalletAddress && lamports >= minLamports) {
        return true;
      }
    }
  }

  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let launchId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const proxyPrivateKey = Deno.env.get("PROXY_WALLET_PRIVATE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return errorResponse("Backend configuration missing", 500);
    }

    if (!proxyPrivateKey) {
      return errorResponse("Missing PROXY_WALLET_PRIVATE_KEY secret", 500);
    }

    const body = await req.json();
    const {
      userWallet,
      paymentSignature,
      tokenName,
      tokenSymbol,
      tokenDescription,
      tokenImageUrl,
      solAmount,
      devBuyAmount,
      universe,
      twitter,
      telegram,
      website,
    } = body;

    if (!userWallet || !paymentSignature || !tokenName || !tokenSymbol || !tokenImageUrl) {
      return errorResponse("Missing required fields", 400);
    }

    const totalSolAmount = Number(solAmount ?? 0.02);
    const initialBuySol = Math.max(0, Number(devBuyAmount ?? 0));

    const proxyKeypair = Keypair.fromSecretKey(parseProxySecretKey(proxyPrivateKey));
    const proxyWalletAddress = proxyKeypair.publicKey.toBase58();
    const connection = new Connection(RPC_URL, "confirmed");

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: row, error: insertError } = await supabase
      .from("token_launches")
      .insert({
        user_wallet: userWallet,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        token_description: tokenDescription || "",
        token_image_url: tokenImageUrl,
        payment_signature: paymentSignature,
        sol_amount: totalSolAmount,
        status: "pending",
        universe: universe || "Italian Brainrot",
        twitter: twitter || null,
        telegram: telegram || null,
        website: website || null,
      })
      .select("id")
      .single();

    if (insertError || !row) {
      return errorResponse(`Failed to create launch record: ${insertError?.message || "Unknown error"}`, 500);
    }

    launchId = row.id;

    const expectedLamports = Math.floor(totalSolAmount * 1_000_000_000);
    const paymentOk = await verifyPaymentReceived(
      connection,
      paymentSignature,
      proxyWalletAddress,
      expectedLamports,
    );

    if (!paymentOk) {
      await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
      return errorResponse("Payment not verified on-chain", 400);
    }

    const imageRes = await fetch(tokenImageUrl);
    if (!imageRes.ok) {
      await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
      return errorResponse("Could not fetch token image for IPFS upload", 400);
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
      const ipfsErr = await ipfsRes.text();
      await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
      return errorResponse(`IPFS upload failed: ${ipfsErr}`, 500);
    }

    const ipfsData = await ipfsRes.json();
    const metadataUri = ipfsData?.metadataUri;
    if (!metadataUri) {
      await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
      return errorResponse("IPFS metadata URI missing", 500);
    }

    const mintKeypair = Keypair.generate();

    const tradePayload = {
      publicKey: proxyWalletAddress,
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
      const tradeErr = await tradeRes.text();
      await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
      return errorResponse(`PumpPortal create failed: ${tradeErr}`, 500);
    }

    const txBytes = new Uint8Array(await tradeRes.arrayBuffer());
    const tx = VersionedTransaction.deserialize(txBytes);
    tx.sign([mintKeypair, proxyKeypair]);

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction(signature, "confirmed");

    await supabase
      .from("token_launches")
      .update({
        status: "completed",
        mint_address: mintKeypair.publicKey.toBase58(),
        transaction_signature: signature,
      })
      .eq("id", launchId);

    return new Response(
      JSON.stringify({
        success: true,
        launchId,
        mintAddress: mintKeypair.publicKey.toBase58(),
        transactionSignature: signature,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    try {
      if (launchId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase.from("token_launches").update({ status: "failed" }).eq("id", launchId);
      }
    } catch {
      // ignore secondary error
    }

    return errorResponse((err as Error)?.message || "Launch failed", 500);
  }
});
