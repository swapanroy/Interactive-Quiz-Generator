export const audioContextOptions = { sampleRate: 16000 }; // Input sample rate
export const outputSampleRate = 24000; // Output sample rate from Gemini

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

export function int16ToFloat32(int16Array: Int16Array): Float32Array {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

export async function decodeAudioData(
  audioData: Uint8Array,
  sampleRate: number = 24000
): Promise<AudioBuffer> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  
  // The model returns raw PCM 16-bit, single channel (usually)
  // We need to convert raw bytes to AudioBuffer manually because 
  // standard decodeAudioData expects file headers (WAV/MP3).
  
  const int16 = new Int16Array(audioData.buffer);
  const float32 = int16ToFloat32(int16);
  
  const buffer = audioContext.createBuffer(1, float32.length, sampleRate);
  buffer.getChannelData(0).set(float32);
  
  return buffer;
}