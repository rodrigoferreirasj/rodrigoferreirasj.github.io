
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

// Helper for SHA-512
const sha512 = async (message: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-512', data);
  return bufferToHex(hashBuffer);
};

export const validateAccessKey = async (email: string, dateStr: string, providedKey: string): Promise<boolean> => {
  try {
    // 1. Transformação da data
    // Formato esperado: dd/mm/aaaa
    const [day, month, year] = dateStr.split('/');
    
    // CRÍTICO: Usar Date.UTC para garantir que o timestamp seja gerado em UTC (00:00:00 Z)
    // independentemente do fuso horário do navegador do usuário.
    // Mês em JS é 0-indexed (0 = Janeiro, 7 = Agosto)
    const utcDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0));
    
    // Timestamp em segundos (UNIX)
    const timestamp = Math.floor(utcDate.getTime() / 1000).toString();
    
    // Pegar os últimos 8 dígitos
    const last8Timestamp = timestamp.slice(-8);

    // 2. Hash do e-mail (SHA-256)
    const emailHash = await sha256(email.trim().toLowerCase()); // Normaliza para minúsculo e remove espaços
    
    // Pegar os primeiros 16 caracteres
    const first16Email = emailHash.substring(0, 16);

    // 3. Combinação e Inversão
    const combined = last8Timestamp + first16Email;
    const inverted = combined.split('').reverse().join('');

    // 4. Hash Final (SHA-512)
    const finalHash = await sha512(inverted);

    // Comparação
    return finalHash === providedKey.trim();
  } catch (error) {
    console.error("Erro na validação da chave:", error);
    return false;
  }
};
