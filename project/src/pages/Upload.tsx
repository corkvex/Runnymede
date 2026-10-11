import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '@/context/IdentityContext';
import { saveVideo, type StoredVideo, type ContentType } from '@/lib/storage';
import { UploadCloud, Film, Image as ImageIcon, Check, Loader2, Video, Zap, Mic } from 'lucide-react';

const CATEGORIES = ['Technology', 'Politics', 'Philosophy', 'Science', 'News', 'Education', 'Comedy', 'Vlog'];

export default function Upload() {
  const { identity } = useIdentity();
  const navigate = useNavigate();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [contentType, setContentType] = useState<ContentType>('video');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !videoFile || !title.trim()) return;
    setUploading(true);
    setError('');

    try {
      const videoUrl = URL.createObjectURL(videoFile);
      let thumbnailUrl: string | null = null;
      if (thumbFile) {
        thumbnailUrl = URL.createObjectURL(thumbFile);
      }

      const video: StoredVideo = {
        id: `${identity.fullId}-${Date.now()}`,
        userId: identity.fullId,
        title: title.trim(),
        description: description.trim(),
        videoUrl,
        thumbnailUrl,
        category,
        contentType,
        views: 0,
        createdAt: Date.now(),
      };

      await saveVideo(video);

      if (contentType === 'short') navigate('/shorts');
      else if (contentType === 'podcast') navigate('/videos');
      else navigate('/videos');
    } catch {
      setError('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const inputClass = 'w-full bg-theme-input border border-theme-input-border rounded-lg px-4 py-3 text-theme-text placeholder-theme-text-3 focus:outline-none focus:border-amber-500 transition-colors';

  const contentTypes: { type: ContentType; icon: React.ReactNode; label: string }[] = [
    { type: 'video', icon: <Video size={16} />, label: 'Video' },
    { type: 'short', icon: <Zap size={16} />, label: 'Short' },
    { type: 'podcast', icon: <Mic size={16} />, label: 'Podcast' },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <UploadCloud size={28} className="text-amber-400" />
        <h1 className="text-2xl font-bold text-theme-text">Upload</h1>
      </div>

      <form onSubmit={handleUpload} className="space-y-5">
        {error && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}

        {/* Content type */}
        <div>
          <label className="block text-sm font-medium text-theme-text-2 mb-1.5">Content Type</label>
          <div className="flex gap-2">
            {contentTypes.map(({ type, icon, label }) => (
              <button key={type} type="button" onClick={() => setContentType(type)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${contentType === type ? 'bg-amber-600 text-white' : 'bg-theme-elevated text-theme-text-2 hover:bg-theme-hover'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Video file picker */}
        <div onClick={() => videoInputRef.current?.click()} className="border-2 border-dashed border-theme-input-border rounded-2xl p-8 text-center cursor-pointer hover:border-amber-500 transition-colors">
          <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => e.target.files?.[0] && setVideoFile(e.target.files[0])} className="hidden" />
          {videoFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center"><Check size={28} className="text-green-400" /></div>
              <p className="text-theme-text font-medium text-sm">{videoFile.name}</p>
              <p className="text-theme-text-3 text-xs">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-theme-elevated flex items-center justify-center"><Film size={28} className="text-theme-text-3" /></div>
              <p className="text-theme-text-2 font-medium">Select a video file</p>
              <p className="text-theme-text-3 text-xs">MP4, WebM, MOV</p>
            </div>
          )}
        </div>

        {/* Thumbnail picker */}
        <div onClick={() => thumbInputRef.current?.click()} className="border-2 border-dashed border-theme-input-border rounded-2xl p-4 text-center cursor-pointer hover:border-amber-500 transition-colors">
          <input ref={thumbInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && setThumbFile(e.target.files[0])} className="hidden" />
          {thumbFile ? (
            <div className="flex items-center justify-center gap-2"><Check size={18} className="text-green-400" /><span className="text-theme-text text-sm">{thumbFile.name}</span></div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-theme-text-2"><ImageIcon size={18} /><span className="text-sm">Add thumbnail (optional)</span></div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text-2 mb-1.5">Title <span className="text-red-400">*</span></label>
          <input type="text" required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Title" />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text-2 mb-1.5">Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} resize-none`} placeholder="Description" />
        </div>

        <div>
          <label className="block text-sm font-medium text-theme-text-2 mb-1.5">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-medium text-theme-text-3 rounded-full hover:bg-theme-hover transition-colors">Cancel</button>
          <button type="submit" disabled={uploading || !videoFile || !title.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium rounded-full transition-colors">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            Publish
          </button>
        </div>
      </form>
    </div>
  );
}
