// Pepper constante definida na especificação
const PEPPER = "o-r4iFnVs6B8$Qm+Jc@F7^ZL#hD2P!";
const APP_NAME = "radarlideranca"; // Identificador do app para o hash

// Helper to convert ArrayBuffer to Hex String
const bufferToHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Helper for SHA-256
const sha256 = async (message: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
};

// Helper for HMAC-SHA256
const hmacSha256 = async (key: string, data: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(data);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
};

// Helper for Base64URL encoding
const base64url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const validateAccessKey = async (email: string, providedKey: string): Promise<boolean> => {
  try {
    // 1. Hash do e-mail (SHA-256)
    const emailHash = await sha256(email.trim().toLowerCase());
    
    // 2. Pegar os primeiros 16 caracteres do hash do e-mail
    const emailPart = emailHash.substring(0, 16);

    // 3. Combinar com appName e inverter
    const combinado = (emailPart + APP_NAME).split('').reverse().join('');

    // 4. Gerar HMAC-SHA256 com o PEPPER
    const hmacFull = await hmacSha256(PEPPER, combinado);

    // 5. Truncar para 12 bytes (96 bits)
    const hmacTruncado = hmacFull.slice(0, 12);

    // 6. Converter para Base64URL
    const chaveEsperada = base64url(hmacTruncado);

    // Comparação final
    return providedKey.trim() === chaveEsperada;
  } catch (error) {
    console.error("Erro na validação da chave:", error);
    return false;
  }
};