// src/lib/crypto.ts

let cachedKey: CryptoKey | null = null;
let cachedKeyString: string | null = null;

// Generate random group key
export function generateGroupKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// Convert base64 key → CryptoKey
async function importKey(base64Key: string) {

  if (cachedKey && cachedKeyString === base64Key) {
    return cachedKey;
  }

  const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));

  cachedKey = await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );

  cachedKeyString = base64Key;

  return cachedKey;
}

// Encrypt diary entry
export async function encryptEntry(text: string, groupKey: string): Promise<string> {

  const key = await importKey(groupKey);

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoded = new TextEncoder().encode(text);

  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + cipher.byteLength);

  combined.set(iv);
  combined.set(new Uint8Array(cipher), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Decrypt diary entry
export async function decryptEntry(ciphertext: string, groupKey: string): Promise<string> {


  const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

  const iv = data.slice(0, 12);
  const cipher = data.slice(12);

  const key = await importKey(groupKey);

  try {
   const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipher
   );

   return new TextDecoder().decode(decrypted);
  } catch {
    return "[Corrupted Entry]";
  }
}