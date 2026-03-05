type Callback = (data: any) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners: Map<string, Set<Callback>> = new Map();
let isConnected = false;
const pendingMessages: string[] = [];

function getOrCreateWS(): WebSocket {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return ws;
  }

  ws = new WebSocket('wss://pumpportal.fun/api/data');

  ws.onopen = () => {
    isConnected = true;
    // Send any pending messages
    while (pendingMessages.length > 0) {
      const msg = pendingMessages.shift()!;
      ws?.send(msg);
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Route to listeners
      if (data.txType === 'create') {
        listeners.get('newToken')?.forEach(cb => cb(data));
      }
      if (data.mint) {
        listeners.get(`trade:${data.mint}`)?.forEach(cb => cb(data));
      }
      // Also broadcast to "all" listeners
      listeners.get('all')?.forEach(cb => cb(data));
    } catch {
      // ignore parse errors
    }
  };

  ws.onclose = () => {
    isConnected = false;
    // Reconnect after 3s
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      ws = null;
      if (listeners.size > 0) {
        getOrCreateWS();
        // Re-subscribe
        resubscribeAll();
      }
    }, 3000);
  };

  ws.onerror = () => {
    ws?.close();
  };

  return ws;
}

function sendMessage(msg: object) {
  const str = JSON.stringify(msg);
  const socket = getOrCreateWS();
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(str);
  } else {
    pendingMessages.push(str);
  }
}

function resubscribeAll() {
  if (listeners.has('newToken') && listeners.get('newToken')!.size > 0) {
    sendMessage({ method: 'subscribeNewToken' });
  }
  for (const key of listeners.keys()) {
    if (key.startsWith('trade:')) {
      const mint = key.replace('trade:', '');
      sendMessage({ method: 'subscribeTokenTrade', keys: [mint] });
    }
  }
}

/** Subscribe to new token launches */
export function subscribeNewTokens(callback: Callback): () => void {
  const key = 'newToken';
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(callback);

  if (listeners.get(key)!.size === 1) {
    sendMessage({ method: 'subscribeNewToken' });
  }

  return () => {
    listeners.get(key)?.delete(callback);
    if (listeners.get(key)?.size === 0) {
      sendMessage({ method: 'unsubscribeNewToken' });
      listeners.delete(key);
    }
  };
}

/** Subscribe to trades for a specific token */
export function subscribeTokenTrades(mint: string, callback: Callback): () => void {
  const key = `trade:${mint}`;
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(callback);

  if (listeners.get(key)!.size === 1) {
    sendMessage({ method: 'subscribeTokenTrade', keys: [mint] });
  }

  return () => {
    listeners.get(key)?.delete(callback);
    if (listeners.get(key)?.size === 0) {
      sendMessage({ method: 'unsubscribeTokenTrade', keys: [mint] });
      listeners.delete(key);
    }
  };
}
