import { useState, useEffect, useRef } from 'react';
import {
  FiDownload, FiX, FiFilm, FiList, FiPackage,
  FiAlertTriangle, FiCheckCircle, FiLoader,
  FiChevronDown, FiChevronUp, FiInfo,
} from 'react-icons/fi';
import {
  downloadManifest, downloadEDL,
  downloadZipBundle, renderToVideo,
  detectCapabilities,
} from '../../api/videoExport';

/* ── Export format options ────────────────────────────────────── */
const FORMATS = [
  {
    id: 'video',
    label: 'Video File',
    icon: <FiFilm size={16} />,
    badge: 'WebM / MP4',
    desc: 'Render the full compilation to a single video file in your browser. Requires CORS-compatible sources.',
    warning: null,
    color: 'blue',
  },
  {
    id: 'zip',
    label: 'ZIP Bundle',
    icon: <FiPackage size={16} />,
    badge: 'Clips + EDL + Manifest',
    desc: 'Download all clips as individual files plus an EDL and JSON manifest — ready to import into any NLE.',
    warning: null,
    color: 'purple',
  },
  {
    id: 'edl',
    label: 'EDL File',
    icon: <FiList size={16} />,
    badge: 'CMX 3600',
    desc: 'Export an Edit Decision List for professional NLEs: Premiere Pro, DaVinci Resolve, Final Cut Pro.',
    warning: null,
    color: 'teal',
  },
  {
    id: 'manifest',
    label: 'JSON Manifest',
    icon: <span className="text-sm font-mono">{ }</span>,
    badge: 'Machine-readable',
    desc: 'Full clip metadata, trim points, overlays and fades in a structured JSON file.',
    warning: null,
    color: 'gray',
  },
];

const RESOLUTIONS = [
  { label: '4K — 3840×2160', w: 3840, h: 2160 },
  { label: '1080p — 1920×1080', w: 1920, h: 1080 },
  { label: '720p — 1280×720',  w: 1280, h: 720  },
  { label: '480p — 854×480',   w: 854,  h: 480  },
];

const BITRATES = [
  { label: 'High  — 8 Mbps',   value: 8_000_000  },
  { label: 'Medium — 5 Mbps',  value: 5_000_000  },
  { label: 'Low  — 2 Mbps',    value: 2_000_000  },
];

const COLOR = {
  blue:   'bg-blue-600/20   border-blue-600/50  text-blue-300',
  purple: 'bg-purple-600/20 border-purple-600/50 text-purple-300',
  teal:   'bg-teal-600/20   border-teal-600/50  text-teal-300',
  gray:   'bg-gray-700/40   border-gray-600/50  text-gray-300',
};
const BADGE = {
  blue:   'bg-blue-700   text-blue-200',
  purple: 'bg-purple-700 text-purple-200',
  teal:   'bg-teal-700   text-teal-200',
  gray:   'bg-gray-700   text-gray-300',
};
const BTN = {
  blue:   'bg-blue-600   hover:bg-blue-500',
  purple: 'bg-purple-600 hover:bg-purple-500',
  teal:   'bg-teal-600   hover:bg-teal-500',
  gray:   'bg-gray-600   hover:bg-gray-500',
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* ── Component ────────────────────────────────────────────────── */

export default function ExportModal({ isOpen, onClose, clips, project }) {
  const [format,     setFormat]     = useState('video');
  const [resolution, setResolution] = useState(RESOLUTIONS[2]); // 720p default
  const [bitrate,    setBitrate]    = useState(BITRATES[1]);
  const [fps,        setFps]        = useState(30);
  const [advanced,   setAdvanced]   = useState(false);
  const [status,     setStatus]     = useState('idle'); // idle | running | done | error | cancelled
  const [progress,   setProgress]   = useState(0);
  const [label,      setLabel]      = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');
  const [caps,       setCaps]       = useState(null);
  const signalRef = useRef({ cancelled: false });

  useEffect(() => {
    if (isOpen) {
      setCaps(detectCapabilities());
      setStatus('idle');
      setProgress(0);
      setLabel('');
      setErrorMsg('');
      signalRef.current = { cancelled: false };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalDur   = clips.reduce((s, c) => s + (c.end_trim - c.start_trim), 0);
  const sel        = FORMATS.find(f => f.id === format);
  const isRunning  = status === 'running';

  const onProgress = (pct, lbl) => {
    setProgress(pct);
    setLabel(lbl || '');
  };

  const cancel = () => {
    signalRef.current.cancelled = true;
    setStatus('cancelled');
    setLabel('Export cancelled.');
  };

  const handleExport = async () => {
    if (clips.length === 0) return;
    setStatus('running');
    setProgress(0);
    setErrorMsg('');
    signalRef.current = { cancelled: false };

    try {
      switch (format) {
        case 'manifest':
          downloadManifest(clips, project);
          setProgress(100);
          setLabel('Manifest downloaded!');
          setStatus('done');
          break;

        case 'edl':
          downloadEDL(clips, project);
          setProgress(100);
          setLabel('EDL downloaded!');
          setStatus('done');
          break;

        case 'zip':
          await downloadZipBundle(clips, project, onProgress);
          setStatus('done');
          break;

        case 'video': {
          const blob = await renderToVideo(
            clips,
            { width: resolution.w, height: resolution.h, fps, videoBitrate: bitrate.value },
            onProgress,
            signalRef.current
          );
          if (blob && !signalRef.current.cancelled) {
            const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href    = url;
            a.download = `${project?.name || 'compilation'}.${ext}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 15_000);
            setStatus('done');
          }
          break;
        }
        default: break;
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg(e.message || 'Export failed. Try a different format.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget && !isRunning) onClose(); }}
    >
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl
        shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FiDownload size={16} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Export Compilation</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="text-gray-500 hover:text-white transition-colors p-1
              rounded-lg hover:bg-gray-800 disabled:opacity-30"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Summary strip ───────────────────────────────────── */}
          <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-800 rounded-xl">
            <span className="text-2xl">🎬</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {project?.name || 'Untitled Compilation'}
              </p>
              <p className="text-xs text-gray-500">
                {clips.length} clip{clips.length !== 1 ? 's' : ''} · {fmt(totalDur)} total
              </p>
            </div>
          </div>

          {/* ── Format picker ───────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              Export Format
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => { if (!isRunning) setFormat(f.id); }}
                  disabled={isRunning}
                  className={`flex flex-col gap-1.5 p-3 rounded-xl border text-left
                    transition-all disabled:cursor-not-allowed
                    ${format === f.id
                      ? COLOR[f.color]
                      : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${format === f.id ? '' : 'text-gray-500'}`}>{f.icon}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full
                      ${format === f.id ? BADGE[f.color] : 'bg-gray-700 text-gray-500'}`}>
                      {f.badge}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-none">{f.label}</p>
                  <p className="text-[10px] leading-snug opacity-70">{f.desc.slice(0, 60)}…</p>
                </button>
              ))}
            </div>

            {/* Format description */}
            <p className="text-[11px] text-gray-500 px-1 leading-relaxed">
              {sel?.desc}
            </p>
          </div>

          {/* ── Video options ────────────────────────────────────── */}
          {format === 'video' && (
            <div className="space-y-3">
              {/* Browser capability warning */}
              {caps && !caps.canRecord && (
                <div className="flex items-start gap-2 px-3 py-2.5
                  bg-yellow-900/30 border border-yellow-800/50 rounded-xl">
                  <FiAlertTriangle size={13} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-300">
                    Your browser doesn't support MediaRecorder.
                    Try Chrome or Firefox, or use ZIP Bundle instead.
                  </p>
                </div>
              )}
              {caps?.canRecord && (
                <div className="flex items-start gap-2 px-3 py-2 bg-blue-900/20
                  border border-blue-800/30 rounded-xl">
                  <FiInfo size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-blue-300 leading-relaxed">
                    Renders entirely in your browser using Canvas + MediaRecorder.
                    Format: <strong>{caps.supportsMP4 ? 'MP4 (H.264)' : 'WebM (VP9)'}</strong>.
                    CORS-blocked clips will render as a placeholder frame.
                  </p>
                </div>
              )}

              {/* Resolution */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Resolution</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {RESOLUTIONS.map(r => (
                    <button key={r.label}
                      onClick={() => setResolution(r)}
                      disabled={isRunning}
                      className={`py-2 px-3 rounded-lg text-xs border transition-colors
                        ${resolution.label === r.label
                          ? 'bg-blue-700/40 border-blue-600 text-blue-200'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                        }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced toggle */}
              <button
                onClick={() => setAdvanced(a => !a)}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                {advanced ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                Advanced options
              </button>

              {advanced && (
                <div className="space-y-3 pl-2 border-l-2 border-gray-800">
                  {/* Bitrate */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Video Bitrate</p>
                    <div className="flex flex-col gap-1">
                      {BITRATES.map(b => (
                        <label key={b.value}
                          className="flex items-center gap-2 cursor-pointer group">
                          <input type="radio"
                            checked={bitrate.value === b.value}
                            onChange={() => setBitrate(b)}
                            disabled={isRunning}
                            className="accent-blue-500"
                          />
                          <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                            {b.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* FPS */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      Frame Rate: {fps} fps
                    </p>
                    <input type="range" min={15} max={60} step={5} value={fps}
                      onChange={e => setFps(+e.target.value)}
                      disabled={isRunning}
                      className="w-full accent-blue-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>15</span><span>24</span><span>30</span><span>60</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Progress bar ─────────────────────────────────────── */}
          {(isRunning || status === 'done' || status === 'cancelled') && (
            <div className="space-y-2">
              <div className="relative h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300
                    ${status === 'done'      ? 'bg-emerald-500' :
                      status === 'cancelled' ? 'bg-gray-600'    : 'bg-blue-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{label}</p>
                <span className="text-xs font-mono text-gray-500">{progress}%</span>
              </div>
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────── */}
          {status === 'error' && (
            <div className="flex items-start gap-2 px-3 py-2.5
              bg-red-900/30 border border-red-800/50 rounded-xl">
              <FiAlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-300 font-semibold">Export failed</p>
                <p className="text-[11px] text-red-400 mt-0.5">{errorMsg}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Try switching to ZIP Bundle which works without CORS restrictions.
                </p>
              </div>
            </div>
          )}

          {/* ── Success ──────────────────────────────────────────── */}
          {status === 'done' && (
            <div className="flex items-center gap-2 px-3 py-2.5
              bg-emerald-900/30 border border-emerald-800/50 rounded-xl">
              <FiCheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-300 font-semibold">Export complete — check your downloads!</p>
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-800 flex-shrink-0">
          {isRunning ? (
            <>
              <button
                onClick={cancel}
                className="flex-1 flex items-center justify-center gap-2 py-2.5
                  bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel Export
              </button>
              <div className="flex items-center justify-center px-4">
                <FiLoader size={16} className="animate-spin text-gray-500" />
              </div>
            </>
          ) : status === 'done' || status === 'cancelled' ? (
            <>
              <button
                onClick={() => { setStatus('idle'); setProgress(0); setLabel(''); }}
                className="flex-1 py-2.5 border border-gray-700 hover:border-gray-500
                  text-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                Export Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600
                  text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleExport}
                disabled={clips.length === 0 || (format === 'video' && caps && !caps.canRecord)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5
                  text-white rounded-xl text-sm font-semibold transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed
                  ${BTN[sel?.color || 'blue']}`}
              >
                <FiDownload size={14} />
                Export {sel?.label}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-700 hover:border-gray-500
                  text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
