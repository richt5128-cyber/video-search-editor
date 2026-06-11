import { useState } from 'react';
import { FiPlus, FiCheck, FiExternalLink, FiDownload, FiClock, FiMonitor, FiPlay, FiX } from 'react-icons/fi';
import clsx from 'clsx';

const SOURCE_COLORS = {
  'Pixabay':         'bg-green-800 text-green-300',
  'Pexels':          'bg-teal-800 text-teal-300',
  'Internet Archive':'bg-orange-800 text-orange-300',
};

function fmtDuration(s) {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function VideoCard({ video, view, onAdd, added }) {
  const [previewing, setPreviewing] = useState(false);
  const [imgErr, setImgErr]         = useState(false);

  const isGrid = view === 'grid';

  if (isGrid) {
    return (
      <div className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all flex flex-col">
        {/* Thumbnail area */}
        <div className="relative aspect-video bg-gray-800 overflow-hidden">
          {previewing ? (
            <div className="absolute inset-0 flex flex-col">
              <video
                src={video.downloadUrl}
                autoPlay
                controls
                className="w-full h-full object-cover"
              />
              <button onClick={() => setPreviewing(false)}
                className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full text-xs">
                <FiX />
              </button>
            </div>
          ) : (
            <>
              {!imgErr
                ? <img src={video.thumbnail} alt={video.title}
                    onError={() => setImgErr(true)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                : <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-800">🎬</div>
              }

              {/* Play overlay */}
              {video.downloadUrl && (
                <button onClick={() => setPreviewing(true)}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <FiPlay className="text-white text-xl ml-0.5" />
                  </div>
                </button>
              )}

              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', SOURCE_COLORS[video.source] || 'bg-gray-700 text-gray-300')}>
                  {video.source}
                </span>
              </div>

              {video.duration && (
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {fmtDuration(video.duration)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          <p className="text-sm text-gray-200 line-clamp-2 leading-snug">{video.title}</p>

          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-auto">
            {video.author && <span>by {video.author}</span>}
            {video.width  && <span className="flex items-center gap-0.5"><FiMonitor className="text-[9px]" />{video.width}×{video.height}</span>}
            <span className="text-gray-600">{video.license}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onAdd(video)}
              disabled={added}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                added
                  ? 'bg-green-900/50 text-green-400 border border-green-800 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              )}
            >
              {added ? <><FiCheck /> Added</> : <><FiPlus /> Add to Timeline</>}
            </button>

            {video.pageUrl && (
              <a href={video.pageUrl} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                <FiExternalLink className="text-sm" />
              </a>
            )}

            {video.downloadUrl && (
              <a href={video.downloadUrl} download target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
                <FiDownload className="text-sm" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-3 transition-all group">
      <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
        {!imgErr
          ? <img src={video.thumbnail} alt={video.title} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
        }
        {video.duration && (
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded">
            {fmtDuration(video.duration)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{video.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', SOURCE_COLORS[video.source] || 'bg-gray-700 text-gray-300')}>
            {video.source}
          </span>
          {video.author && <span className="text-[11px] text-gray-500">by {video.author}</span>}
          {video.width  && <span className="text-[11px] text-gray-600">{video.width}p</span>}
        </div>
        <p className="text-[10px] text-gray-600 mt-0.5">{video.license}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {video.pageUrl && (
          <a href={video.pageUrl} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-white transition-colors">
            <FiExternalLink className="text-sm" />
          </a>
        )}
        {video.downloadUrl && (
          <a href={video.downloadUrl} download target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-white transition-colors">
            <FiDownload className="text-sm" />
          </a>
        )}
        <button
          onClick={() => onAdd(video)}
          disabled={added}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            added
              ? 'bg-green-900/50 text-green-400 border border-green-800 cursor-default'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          )}
        >
          {added ? <><FiCheck /> Added</> : <><FiPlus /> Add</>}
        </button>
      </div>
    </div>
  );
}
