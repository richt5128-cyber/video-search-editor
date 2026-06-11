import { useState } from 'react';
import {
  FiPlus, FiCheck, FiExternalLink, FiDownload,
  FiPlay, FiX, FiClock, FiMonitor, FiUser,
} from 'react-icons/fi';

const SOURCE_STYLES = {
  'Pixabay':          { bg: 'bg-green-900/60',  text: 'text-green-300',  dot: 'bg-green-400'  },
  'Pexels':           { bg: 'bg-teal-900/60',   text: 'text-teal-300',   dot: 'bg-teal-400'   },
  'Internet Archive': { bg: 'bg-orange-900/60', text: 'text-orange-300', dot: 'bg-orange-400' },
};

function fmtDur(s) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

/* ── Grid card ───────────────────────────────────────────────── */
function GridCard({ video, onAdd, added }) {
  const [previewing, setPreviewing] = useState(false);
  const [imgErr,     setImgErr]     = useState(false);
  const ss = SOURCE_STYLES[video.source] || { bg: 'bg-gray-800', text: 'text-gray-300', dot: 'bg-gray-500' };

  return (
    <div className="group relative bg-gray-900 rounded-xl overflow-hidden
      border border-gray-800 hover:border-gray-600 transition-all
      flex flex-col shadow-sm hover:shadow-xl hover:shadow-black/40">

      {/* Thumbnail */}
      <div className="relative bg-gray-800 overflow-hidden" style={{ paddingTop: '56.25%' }}>
        <div className="absolute inset-0">
          {previewing ? (
            <>
              <video
                src={video.downloadUrl}
                autoPlay controls playsInline
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setPreviewing(false)}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90
                  text-white p-1.5 rounded-full transition-colors z-10">
                <FiX size={12} />
              </button>
            </>
          ) : (
            <>
              {!imgErr
                ? <img
                    src={video.thumbnail} alt={video.title}
                    onError={() => setImgErr(true)}
                    className="w-full h-full object-cover
                      group-hover:scale-105 transition-transform duration-500"
                  />
                : <div className="w-full h-full flex items-center justify-center
                    text-4xl bg-gray-800 text-gray-600">🎬</div>
              }

              {/* Play overlay */}
              {video.downloadUrl && (
                <button
                  onClick={() => setPreviewing(true)}
                  className="absolute inset-0 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                >
                  <div className="bg-white/15 backdrop-blur-sm border border-white/20
                    rounded-full p-3.5 transition-transform group-hover:scale-110">
                    <FiPlay size={20} className="text-white ml-0.5" />
                  </div>
                </button>
              )}

              {/* Source badge */}
              <div className="absolute top-2 left-2">
                <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5
                  rounded-full font-semibold ${ss.bg} ${ss.text} border border-white/10`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                  {video.source}
                </span>
              </div>

              {/* Duration */}
              {video.duration && (
                <span className="absolute bottom-2 right-2 flex items-center gap-0.5
                  bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  <FiClock size={8} />
                  {fmtDur(video.duration)}
                </span>
              )}

              {/* Added overlay */}
              {added && (
                <div className="absolute inset-0 bg-emerald-900/30 flex items-center
                  justify-center pointer-events-none">
                  <div className="bg-emerald-600 rounded-full p-2">
                    <FiCheck size={16} className="text-white" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-xs text-gray-200 line-clamp-2 leading-snug font-medium">
          {video.title}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 mt-auto">
          {video.author && (
            <span className="flex items-center gap-0.5">
              <FiUser size={9} /> {video.author}
            </span>
          )}
          {video.width && (
            <span className="flex items-center gap-0.5">
              <FiMonitor size={9} /> {video.width}×{video.height}
            </span>
          )}
          {video.license && (
            <span className="text-gray-600">{video.license}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-0.5">
          <button
            onClick={() => !added && onAdd(video)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5
              rounded-lg text-xs font-semibold transition-all
              ${added
                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/60 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
              }`}
          >
            {added
              ? <><FiCheck size={11} /> In Timeline</>
              : <><FiPlus size={11} /> Add</>
            }
          </button>

          {video.pageUrl && (
            <a
              href={video.pageUrl} target="_blank" rel="noopener noreferrer"
              title="View source page"
              className="p-1.5 rounded-lg border border-gray-700
                text-gray-500 hover:text-white hover:border-gray-500 transition-colors"
            >
              <FiExternalLink size={12} />
            </a>
          )}

          {video.downloadUrl && (
            <a
              href={video.downloadUrl} download target="_blank" rel="noopener noreferrer"
              title="Download clip"
              className="p-1.5 rounded-lg border border-gray-700
                text-gray-500 hover:text-white hover:border-gray-500 transition-colors"
            >
              <FiDownload size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── List card ───────────────────────────────────────────────── */
function ListCard({ video, onAdd, added }) {
  const [imgErr, setImgErr] = useState(false);
  const ss = SOURCE_STYLES[video.source] || { bg: 'bg-gray-800', text: 'text-gray-300', dot: 'bg-gray-500' };

  return (
    <div className="flex items-center gap-3 bg-gray-900 border border-gray-800
      hover:border-gray-600 rounded-xl p-3 transition-all group">

      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-28 h-16 rounded-lg overflow-hidden bg-gray-800">
        {!imgErr
          ? <img src={video.thumbnail} alt={video.title}
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          : <div className="w-full h-full flex items-center justify-center text-xl text-gray-600">🎬</div>
        }
        {video.duration && (
          <span className="absolute bottom-1 right-1 bg-black/70 text-white
            text-[9px] px-1 py-0.5 rounded font-mono">
            {fmtDur(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-gray-200 truncate">{video.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5
            rounded-full font-semibold ${ss.bg} ${ss.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
            {video.source}
          </span>
          {video.author && (
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
              <FiUser size={9} /> {video.author}
            </span>
          )}
          {video.width && (
            <span className="text-[10px] text-gray-600">
              {video.width}×{video.height}
            </span>
          )}
        </div>
        {video.license && (
          <p className="text-[10px] text-gray-600">{video.license}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {video.pageUrl && (
          <a href={video.pageUrl} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-gray-700
              text-gray-500 hover:text-white transition-colors">
            <FiExternalLink size={12} />
          </a>
        )}
        {video.downloadUrl && (
          <a href={video.downloadUrl} download target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-gray-700
              text-gray-500 hover:text-white transition-colors">
            <FiDownload size={12} />
          </a>
        )}
        <button
          onClick={() => !added && onAdd(video)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            font-semibold transition-all
            ${added
              ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/60 cursor-default'
              : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
            }`}
        >
          {added ? <><FiCheck size={11} /> Added</> : <><FiPlus size={11} /> Add</>}
        </button>
      </div>
    </div>
  );
}

/* ── Exported component ──────────────────────────────────────── */
export default function VideoCard({ video, view, onAdd, added }) {
  return view === 'list'
    ? <ListCard  video={video} onAdd={onAdd} added={added} />
    : <GridCard  video={video} onAdd={onAdd} added={added} />;
}
