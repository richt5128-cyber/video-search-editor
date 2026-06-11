import { useEffect, useRef, useState } from 'react';
import {
  FiX, FiPlus, FiCheck, FiDownload, FiExternalLink,
  FiClock, FiMonitor, FiUser, FiTag, FiPlay, FiPause,
  FiVolume2, FiVolumeX,
} from 'react-icons/fi';

const SOURCE_STYLES = {
  'Pixabay':          { bg: 'bg-green-900/60',  text: 'text-green-300',  dot: 'bg-green-400'  },
  'Pexels':           { bg: 'bg-teal-900/60',   text: 'text-teal-300',   dot: 'bg-teal-400'   },
  'Internet Archive': { bg: 'bg-orange-900/60', text: 'text-orange-300', dot: 'bg-orange-400' },
};

function fmtDur(s) {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function PreviewDrawer({ video, onClose, onAdd, added }) {
  const videoRef  = useRef();
  const [playing, setPlaying]  = useState(false);
  const [muted,   setMuted]    = useState(true);
  const [elapsed, setElapsed]  = useState(0);
  const [imgErr,  setImgErr]   = useState(false);

  // Reset on new video
  useEffect(() => {
    setPlaying(false);
    setElapsed(0);
    setImgErr(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [video?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else         { videoRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(m => !m);
  };

  const ss = video ? (SOURCE_STYLES[video.source] || { bg: 'bg-gray-800', text: 'text-gray-300', dot: 'bg-gray-500' }) : {};
  const pct = video?.duration && elapsed ? Math.min((elapsed / video.duration) * 100, 100) : 0;

  if (!video) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md
        bg-gray-900 border-l border-gray-800 shadow-2xl flex flex-col
        animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3
          border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5
              rounded-full font-semibold flex-shrink-0 ${ss.bg} ${ss.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
              {video.source}
            </span>
            <p className="text-sm font-semibold text-white truncate">{video.title}</p>
          </div>
          <button onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1
              rounded-lg hover:bg-gray-800 flex-shrink-0 ml-2">
            <FiX size={16} />
          </button>
        </div>

        {/* Video player */}
        <div className="flex-shrink-0 relative bg-black" style={{ aspectRatio: '16/9' }}>
          {video.downloadUrl ? (
            <>
              <video
                ref={videoRef}
                src={video.downloadUrl}
                className="w-full h-full object-contain"
                muted={muted}
                playsInline
                preload="metadata"
                onTimeUpdate={e => setElapsed(e.target.currentTime)}
                onEnded={() => setPlaying(false)}
                onError={() => setImgErr(true)}
              />

              {/* Play / mute overlay */}
              <div className="absolute inset-0 flex items-center justify-center
                opacity-0 hover:opacity-100 transition-opacity bg-black/30 group">
                <button onClick={togglePlay}
                  className="bg-white/20 backdrop-blur border border-white/20
                    rounded-full p-4 transition-transform hover:scale-110">
                  {playing
                    ? <FiPause size={22} className="text-white" />
                    : <FiPlay  size={22} className="text-white ml-0.5" />
                  }
                </button>
              </div>

              {/* Controls bar */}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2
                bg-gradient-to-t from-black/80 to-transparent">
                {/* Progress bar */}
                {video.duration && (
                  <div className="relative h-1 bg-white/20 rounded-full mb-2 cursor-pointer"
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const t    = ((e.clientX - rect.left) / rect.width) * video.duration;
                      if (videoRef.current) {
                        videoRef.current.currentTime = t;
                        setElapsed(t);
                      }
                    }}
                  >
                    <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                      style={{ width: `${pct}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5
                      bg-white rounded-full shadow -mt-0"
                      style={{ left: `calc(${pct}% - 5px)` }} />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={togglePlay}
                      className="text-white hover:text-blue-400 transition-colors">
                      {playing ? <FiPause size={14} /> : <FiPlay size={14} />}
                    </button>
                    <button onClick={toggleMute}
                      className="text-white/60 hover:text-white transition-colors">
                      {muted ? <FiVolumeX size={13} /> : <FiVolume2 size={13} />}
                    </button>
                  </div>
                  {video.duration && (
                    <span className="text-[10px] text-white/60 font-mono">
                      {fmtDur(elapsed)} / {fmtDur(video.duration)}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* No video — show thumbnail */
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              {!imgErr
                ? <img src={video.thumbnail} alt="" onError={() => setImgErr(true)}
                    className="w-full h-full object-cover" />
                : <span className="text-5xl">🎬</span>
              }
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-gray-400 bg-black/60 px-3 py-1.5 rounded-lg">
                  No direct preview available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Title */}
          <div>
            <h3 className="text-sm font-bold text-white leading-snug">{video.title}</h3>
            {video.description && (
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-4">
                {typeof video.description === 'string'
                  ? video.description.replace(/<[^>]+>/g, '').slice(0, 400)
                  : ''
                }
              </p>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2">
            {video.duration && (
              <MetaItem icon={<FiClock size={11} />} label="Duration" value={fmtDur(video.duration)} />
            )}
            {video.width && video.height && (
              <MetaItem icon={<FiMonitor size={11} />} label="Resolution" value={`${video.width}×${video.height}`} />
            )}
            {video.author && (
              <MetaItem icon={<FiUser size={11} />} label="Author" value={video.author} />
            )}
            {video.license && (
              <MetaItem icon={<FiTag size={11} />} label="License" value={video.license} />
            )}
          </div>

          {/* Tags */}
          {video.tags && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {video.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 12).map(t => (
                  <span key={t}
                    className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700
                      px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex-shrink-0 flex gap-2 px-4 py-3 border-t border-gray-800">
          <button
            onClick={() => !added && onAdd(video)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5
              rounded-xl text-sm font-semibold transition-all
              ${added
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]'
              }`}
          >
            {added
              ? <><FiCheck size={14} /> In Timeline</>
              : <><FiPlus  size={14} /> Add to Timeline</>
            }
          </button>

          {video.downloadUrl && (
            <a href={video.downloadUrl} download target="_blank" rel="noopener noreferrer"
              title="Download file"
              className="p-2.5 rounded-xl border border-gray-700 hover:border-gray-500
                text-gray-400 hover:text-white transition-colors">
              <FiDownload size={15} />
            </a>
          )}

          {video.pageUrl && (
            <a href={video.pageUrl} target="_blank" rel="noopener noreferrer"
              title="View source page"
              className="p-2.5 rounded-xl border border-gray-700 hover:border-gray-500
                text-gray-400 hover:text-white transition-colors">
              <FiExternalLink size={15} />
            </a>
          )}
        </div>
      </div>
    </>
  );
}

function MetaItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-1.5 bg-gray-800/60 rounded-lg px-2.5 py-2">
      <span className="text-gray-500 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-xs text-gray-200 truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}
