'use client';

/**
 * High-Entropy Device Fingerprinting Engine
 * Collects hardware, GPU, audio, and platform signals without external heavy dependencies.
 */
export async function getClientDeviceFingerprint(): Promise<{
  fingerprintHash: string;
  deviceId: string;
}> {
  if (typeof window === 'undefined') {
    return { fingerprintHash: 'server_env', deviceId: 'server_env' };
  }

  // 1. Persistent Device UUID in LocalStorage & Cookie
  let persistentId = '';
  try {
    persistentId = localStorage.getItem('rizzup_device_id') || '';
    if (!persistentId) {
      persistentId = crypto.randomUUID();
      localStorage.setItem('rizzup_device_id', persistentId);
    }
    // Also store in document.cookie for 1 year
    document.cookie = `rizzup_did=${persistentId}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    persistentId = 'storage_disabled';
  }

  // 2. Hardware Canvas Render Fingerprint
  let canvasSignal = '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial", "Helvetica", sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('RizzUp.AI, 🔥 <alpha> 100%!', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('RizzUp.AI, 🔥 <alpha> 100%!', 4, 17);
      canvasSignal = canvas.toDataURL();
    }
  } catch {
    canvasSignal = 'canvas_error';
  }

  // 3. WebGL GPU Vendor & Renderer
  let webglSignal = '';
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        webglSignal = `${vendor}:::${renderer}`;
      } else {
        webglSignal = gl.getParameter(gl.RENDERER) || '';
      }
    }
  } catch {
    webglSignal = 'webgl_error';
  }

  // 4. AudioContext Synthesis Signal
  let audioSignal = '';
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      const audioContext = new AudioCtx();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      gain.gain.value = 0; // mute
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gain);
      gain.connect(audioContext.destination);

      audioSignal = `${audioContext.sampleRate}::${analyser.fftSize}`;
      audioContext.close().catch(() => {});
    }
  } catch {
    audioSignal = 'audio_error';
  }

  // 5. Screen, Platform & Hardware Specifications
  const screenSignal = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}@${window.devicePixelRatio || 1}`;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const language = navigator.language || 'en';
  const platform = navigator.platform || 'unknown';

  // 6. Concatenate All Raw Signals
  const rawFingerprint = [
    canvasSignal,
    webglSignal,
    audioSignal,
    screenSignal,
    hardwareConcurrency,
    timezone,
    language,
    platform,
  ].join('|||');

  // 7. Compute SHA-256 Digest
  const encoder = new TextEncoder();
  const data = encoder.encode(rawFingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fingerprintHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return {
    fingerprintHash,
    deviceId: persistentId,
  };
}
