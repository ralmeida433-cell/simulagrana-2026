export const CryptoUtils = {
  async generateKeyPair() {
    return await window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
  },

  async exportPublicKey(keyPair: CryptoKeyPair) {
    const exported = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    return exported;
  },

  async exportPrivateKey(keyPair: CryptoKeyPair) {
    const exported = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
    return exported;
  },

  async importPublicKey(jwk: JsonWebKey) {
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );
  },

  async importPrivateKey(jwk: JsonWebKey) {
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
  },

  async deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey) {
    return await window.crypto.subtle.deriveKey(
      { name: "ECDH", "public": publicKey },
      privateKey,
      { name: "AES-GCM", length: 256 },
      false, // We don't need to export the shared key
      ["encrypt", "decrypt"]
    );
  },

  async encryptMessage(sharedKey: CryptoKey, text: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      data
    );
    
    // Combine IV and cipher text
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  },

  async decryptMessage(sharedKey: CryptoKey, base64Cipher: string) {
    const combinedStr = atob(base64Cipher);
    const combined = new Uint8Array(combinedStr.length);
    for (let i = 0; i < combinedStr.length; i++) {
       combined[i] = combinedStr.charCodeAt(i);
    }
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    try {
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        sharedKey,
        encrypted
      );
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (e) {
      throw e;
    }
  }
};
