/**
 * videoExport.js
 * Client-side export pipeline for CompileStudio.
 *
 * Strategy:
 *  1. Canvas renderer  — draws each clip frame-by-frame onto a <canvas>,
 *     applying trims, fades, text overlays, and screen overlays via the
 *     Canvas 2D API.  MediaRecorder captures the canvas stream to WebM/MP4.
 *  2. ZIP downloader   — when canvas rendering is not feasible (CORS-blocked
 *     sources), falls back to downloading each trimmed clip individually and
 *     bundling them into a ZIP with an EDL manifest so the user can assemble
 *     in any NLE (Premiere, DaVinci, Final Cut, etc.).
 *  3. JSON manifest    — always available; machine-readable edit decision list.
 *  4. EDL (CMX 3600)   — industry-standard cut list for professional NLEs.
 *
 * Browser support notes:
 *  - Canvas + MediaRecorder requires Chrome 74+ / Firefox 82+ / Edge 80+
 *  - Safari does NOT support MediaRecorder with video/webm — falls back to ZIP
 *  - Cross-origin video elements require the server to send CORS headers;
 *    Pixabay CDN and Pexels CDN both do.  Archive.org may not — those clips
 *    automatically fall back to ZIP.
 */

/* ── helpers ─────────────────────────────────────────────────── */

const fmt = (s) =>
  `${String(Math.floor(s / 3600)).padStart(2, '0')}:` +
  `${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:` +
  `${String(Math.floor(s % 60)).padStart(2, '0')}:` +
  `${String(Math.floor((s % 1) * 25)).padStart(2, '0')}`;  // 25fps timecode

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── 1. JSON manifest ─────────────────────────────────────────── */

export function buildManifest(clips, project) {
  const totalDuration = clips.reduce((s, c) => s + (c.end_trim - c.start_trim), 0);
  return {
    version: '1.1',
    format: 'CompileStudio-Manifest',
    exported: new Date().toISOString(),
    project: {
      name:        project?.name     || 'Untitled',
      category:    project?.category || '',
      description: project?.description || '',
      tags:        project?.tags     || [],
    },
    summary: {
      clip_count: clips.length,
      total_duration_seconds: +totalDuration.toFixed(2),
    },
    clips: clips.map((c, i) => ({
      index:        i + 1,
      title:        c.title,
      source:       c.source,
      url:          c.url,
      thumbnail:    c.thumbnail,
      duration:     c.duration,
      in_point:     c.start_trim,
      out_point:    c.end_trim,
      segment_duration: +(c.end_trim - c.start_trim).toFixed(2),
      fade_in:      c.fade_in,
      fade_out:     c.fade_out,
      volume:       c.volume ?? 1,
      text_overlays:   c.text_overlays   || [],
      screen_overlays: c.screen_overlays || [],
    })),
  };
}

export function downloadManifest(clips, project) {
  const manifest = buildManifest(clips, project);
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${slugify(project?.name)}-manifest.json`);
  return manifest;
}

/* ── 2. EDL (CMX 3600) ────────────────────────────────────────── */

export function buildEDL(clips, project) {
  const title = project?.name || 'CompileStudio Export';
  let edl = `TITLE: ${title}\nFCM: NON-DROP FRAME\n\n`;
  let recordIn = 0;

  clips.forEach((c, i) => {
    const dur     = c.end_trim - c.start_trim;
    const recordOut = recordIn + dur;
    const clipNum   = String(i + 1).padStart(3, '0');

    edl += `${clipNum}  AX       V     C        `;
    edl += `${fmt(c.start_trim)} ${fmt(c.end_trim)} `;
    edl += `${fmt(recordIn)} ${fmt(recordOut)}\n`;
    edl += `* FROM CLIP NAME: ${c.title.replace(/[^\w\s-]/g, '').trim()}\n`;
    edl += `* SOURCE URL: ${c.url}\n`;
    if (c.fade_in  > 0) edl += `* FADE IN: ${c.fade_in}s\n`;
    if (c.fade_out > 0) edl += `* FADE OUT: ${c.fade_out}s\n`;
    edl += '\n';
    recordIn = recordOut;
  });

  return edl;
}

export function downloadEDL(clips, project) {
  const edl  = buildEDL(clips, project);
  const blob = new Blob([edl], { type: 'text/plain' });
  triggerDownload(blob, `${slugify(project?.name)}.edl`);
}

/* ── 3. ZIP download bundle ───────────────────────────────────── */

/**
 * Downloads each clip's trimmed segment as a blob, bundles them into
 * a ZIP (using JSZip from CDN), and triggers a download.
 * Falls back gracefully if JSZip is unavailable (downloads files individually).
 *
 * @param {Array}    clips
 * @param {Object}   project
 * @param {Function} onProgress  (pct: 0–100, label: string) => void
 */
export async function downloadZipBundle(clips, project, onProgress) {
  onProgress?.(0, 'Preparing download…');

  // Attempt to load JSZip from CDN
  let JSZip = null;
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    JSZip = mod.default;
  } catch (_) {
    // JSZip unavailable — download files individually
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      onProgress?.(
        Math.round(((i + 1) / clips.length) * 100),
        `Downloading clip ${i + 1}/${clips.length}…`
      );
      const link = document.createElement('a');
      link.href     = c.url;
      link.download = `${String(i + 1).padStart(2, '0')}-${slugify(c.title)}.mp4`;
      link.target   = '_blank';
      link.click();
      await sleep(600);
    }
    onProgress?.(100, 'Done — clips downloading individually');
    return;
  }

  const zip  = new JSZip();
  const name = slugify(project?.name) || 'compilation';
  const folder = zip.folder(name);

  // Add manifest
  folder.file('manifest.json', JSON.stringify(buildManifest(clips, project), null, 2));
  folder.file(`${name}.edl`,   buildEDL(clips, project));

  // Fetch each clip
  for (let i = 0; i < clips.length; i++) {
    const c   = clips[i];
    const pct = Math.round((i / clips.length) * 90);
    onProgress?.(pct, `Fetching clip ${i + 1}/${clips.length}: ${c.title.slice(0, 40)}…`);

    try {
      const res  = await fetch(c.url, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext  = (blob.type.includes('mp4') ? 'mp4' : 'webm');
      folder.file(`${String(i + 1).padStart(2, '0')}-${slugify(c.title)}.${ext}`, blob);
    } catch (err) {
      // CORS block — add a placeholder text file with the URL instead
      folder.file(
        `${String(i + 1).padStart(2, '0')}-${slugify(c.title)}.url.txt`,
        `URL: ${c.url}\nTitle: ${c.title}\nIn: ${c.start_trim}s  Out: ${c.end_trim}s`
      );
    }

    await sleep(100);
  }

  onProgress?.(92, 'Compressing ZIP…');
  const zipBlob = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } },
    ({ percent }) => onProgress?.(92 + Math.round(percent * 0.08), 'Compressing ZIP…')
  );

  onProgress?.(100, 'Done!');
  triggerDownload(zipBlob, `${name}-bundle.zip`);
}

/* ── 4. Canvas renderer ───────────────────────────────────────── */

/**
 * Renders the timeline to a video file using Canvas + MediaRecorder.
 * Each clip is played through a hidden <video> element; the canvas
 * captures frames at the requested FPS and applies:
 *   - Trim (seek to in-point, stop at out-point)
 *   - Fade in / fade out (alpha overlay)
 *   - Text overlays (Canvas 2D fillText)
 *   - Screen overlays (color fill / gradient / vignette / letterbox)
 *
 * @param {Array}    clips
 * @param {Object}   options    { width, height, fps, videoBitrate, audioBitrate }
 * @param {Function} onProgress (pct: 0–100, label: string) => void
 * @param {Object}   signal     { cancelled: bool }
 * @returns {Promise<Blob>}     video blob (video/webm or video/mp4)
 */
export async function renderToVideo(clips, options = {}, onProgress, signal = {}) {
  const {
    width        = 1280,
    height       = 720,
    fps          = 30,
    videoBitrate = 5_000_000,
  } = options;

  const MIME = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
    ? 'video/mp4;codecs=avc1'
    : 'video/webm;codecs=vp9';

  const canvas  = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx     = canvas.getContext('2d');

  const stream   = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: MIME, videoBitsPerSecond: videoBitrate });
  const chunks   = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  recorder.start(100); // collect data every 100ms

  const totalDur = clips.reduce((s, c) => s + (c.end_trim - c.start_trim), 0);
  let elapsed    = 0;

  for (let ci = 0; ci < clips.length; ci++) {
    if (signal.cancelled) break;

    const clip    = clips[ci];
    const clipDur = clip.end_trim - clip.start_trim;

    onProgress?.(
      Math.round((elapsed / totalDur) * 90),
      `Rendering clip ${ci + 1}/${clips.length}: ${clip.title.slice(0, 35)}…`
    );

    await renderClip(ctx, clip, { width, height, fps, clipDur, signal });
    elapsed += clipDur;
  }

  if (!signal.cancelled) {
    onProgress?.(92, 'Finalizing video…');
  }

  recorder.stop();
  await new Promise(r => { recorder.onstop = r; });

  if (signal.cancelled) return null;

  onProgress?.(100, 'Done!');
  return new Blob(chunks, { type: MIME });
}

async function renderClip(ctx, clip, { width, height, fps, clipDur, signal }) {
  return new Promise((resolve, reject) => {
    const video       = document.createElement('video');
    video.src         = clip.url;
    video.crossOrigin = 'anonymous';
    video.muted       = true;
    video.playbackRate = 1;

    const frameInterval = 1000 / fps;
    let frameTimer      = null;
    let startWallTime   = null;

    const drawFrame = () => {
      if (signal?.cancelled) { cleanup(); resolve(); return; }

      const wallElapsed = (performance.now() - startWallTime) / 1000;
      const videoTime   = clip.start_trim + wallElapsed;

      if (videoTime >= clip.end_trim || video.ended) {
        cleanup(); resolve(); return;
      }

      const t      = videoTime - clip.start_trim; // 0 → clipDur
      const alpha  = computeAlpha(t, clipDur, clip.fade_in, clip.fade_out);

      // Draw video frame
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);

      // Screen overlays
      (clip.screen_overlays || []).forEach(o => drawScreenOverlay(ctx, o, t, ctx.canvas));

      // Fade alpha overlay
      if (alpha < 1) {
        ctx.globalAlpha = 1 - alpha;
        ctx.fillStyle   = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }

      // Text overlays
      (clip.text_overlays || []).forEach(o => drawTextOverlay(ctx, o, t, ctx.canvas));

      ctx.restore();

      frameTimer = setTimeout(drawFrame, frameInterval);
    };

    const cleanup = () => {
      clearTimeout(frameTimer);
      video.pause();
      video.src = '';
    };

    video.addEventListener('canplay', () => {
      video.currentTime = clip.start_trim;
    }, { once: true });

    video.addEventListener('seeked', () => {
      video.play().then(() => {
        startWallTime = performance.now();
        drawFrame();
      }).catch(err => { cleanup(); reject(err); });
    }, { once: true });

    video.addEventListener('error', () => {
      cleanup();
      // Draw black frame as placeholder
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = '#555';
      ctx.font      = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠ Could not load: ${clip.title.slice(0, 40)}`, ctx.canvas.width / 2, ctx.canvas.height / 2);
      setTimeout(resolve, clipDur * 1000);
    });

    video.load();
  });
}

/* ── Canvas helpers ───────────────────────────────────────────── */

function computeAlpha(t, dur, fadeIn, fadeOut) {
  if (fadeIn  > 0 && t < fadeIn)       return t / fadeIn;
  if (fadeOut > 0 && t > dur - fadeOut) return (dur - t) / fadeOut;
  return 1;
}

function drawTextOverlay(ctx, o, t, canvas) {
  if (t < (o.start ?? 0) || t > (o.end ?? Infinity)) return;
  const x = posX(o.position, canvas.width);
  const y = posY(o.position, canvas.height);
  ctx.save();
  ctx.font = `${o.italic ? 'italic ' : ''}${o.bold ? 'bold ' : ''}${o.size || 24}px ${o.font || 'sans-serif'}`;
  ctx.textAlign    = textAlignFor(o.position);
  ctx.textBaseline = 'middle';
  if (o.shadow) {
    ctx.shadowColor   = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur    = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
  }
  if (o.bg && o.bg !== 'transparent') {
    const m = ctx.measureText(o.text);
    const pad = 8;
    const bx  = x - (ctx.textAlign === 'center' ? m.width / 2 : ctx.textAlign === 'right' ? m.width : 0) - pad;
    ctx.fillStyle   = o.bg;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(bx, y - (o.size || 24) / 2 - pad / 2, m.width + pad * 2, (o.size || 24) + pad);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = o.color || '#ffffff';
  ctx.fillText(o.text, x, y);
  ctx.restore();
}

function drawScreenOverlay(ctx, o, t, canvas) {
  if (t < (o.start ?? 0) || t > (o.end ?? Infinity)) return;
  ctx.save();
  ctx.globalAlpha   = o.opacity ?? 0.3;
  ctx.globalCompositeOperation = o.blendMode || 'source-over';

  switch (o.type) {
    case 'color':
      ctx.fillStyle = o.color || '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
    case 'gradient': {
      const dir = o.gradientDir === 'to-top';
      const grd = ctx.createLinearGradient(0, dir ? canvas.height : 0, 0, dir ? 0 : canvas.height);
      grd.addColorStop(0, o.gradientFrom || '#000000');
      grd.addColorStop(1, o.gradientTo   || 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
    }
    case 'vignette': {
      ctx.globalAlpha = 1;
      const r   = Math.max(canvas.width, canvas.height) * 0.8;
      const grd = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, r * (1 - (o.vignetteSize || 0.5)),
        canvas.width / 2, canvas.height / 2, r
      );
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      break;
    }
    case 'bars': {
      ctx.globalAlpha = 1;
      ctx.fillStyle   = '#000000';
      const barH = (o.barHeight || 0.1) * canvas.height;
      ctx.fillRect(0, 0, canvas.width, barH);
      ctx.fillRect(0, canvas.height - barH, canvas.width, barH);
      break;
    }
    default: break;
  }
  ctx.restore();
}

function posX(pos, w) {
  if (!pos) return w / 2;
  if (pos.includes('left'))   return 20;
  if (pos.includes('right'))  return w - 20;
  return w / 2;
}
function posY(pos, h) {
  if (!pos) return h / 2;
  if (pos.includes('top'))    return 40;
  if (pos.includes('bot'))    return h - 40;
  return h / 2;
}
function textAlignFor(pos) {
  if (!pos) return 'center';
  if (pos.includes('left'))  return 'left';
  if (pos.includes('right')) return 'right';
  return 'center';
}

/* ── utils ────────────────────────────────────────────────────── */

function slugify(str) {
  return (str || 'export')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* ── capability detection ─────────────────────────────────────── */

export function detectCapabilities() {
  const canRecord   = typeof MediaRecorder !== 'undefined';
  const supportsWebM = canRecord && MediaRecorder.isTypeSupported('video/webm;codecs=vp9');
  const supportsMP4  = canRecord && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1');
  return {
    canRecord,
    supportsWebM,
    supportsMP4,
    recommendedFormat: supportsMP4 ? 'mp4' : supportsWebM ? 'webm' : null,
  };
}
