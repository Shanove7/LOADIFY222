// credits : kasan
import React, { useState, useRef } from 'react';
import { UploadCloud, File, Copy, Check, Terminal, Zap, Database } from 'lucide-react';

const Button = ({ children, onClick, className = "", variant = "primary", disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800/50"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}>
      {children}
    </button>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [lastUploaded, setLastUploaded] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const handleUpload = async (file) => {
    if (file.size > 15 * 1024 * 1024) {
      setError("File max 15MB");
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('googleusercontent');
      
      let data;
      if (isLocal) {
        await new Promise(r => setTimeout(r, 1000));
        data = { success: true, id: 'demo_id', url: URL.createObjectURL(file) };
      } else {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }

      const newFile = {
        id: data.id,
        name: file.name,
        url: isLocal ? data.url : window.location.origin + data.url,
        type: file.type
      };
      
      setLastUploaded(newFile);
      setHistory(prev => [newFile, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      <nav className="border-b border-slate-800/50 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
            <h1 className="text-lg font-bold">KasanShare <span className="text-xs font-normal text-slate-400 border border-slate-700 rounded px-1 ml-1">v2.0</span></h1>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" className={activeTab === 'upload' ? 'bg-slate-800 text-white' : ''} onClick={() => setActiveTab('upload')}>Upload</Button>
            <Button variant="ghost" className={activeTab === 'api' ? 'bg-slate-800 text-white' : ''} onClick={() => setActiveTab('api')}>API</Button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {activeTab === 'upload' ? (
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 space-y-6">
              <div className="h-64 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/30 hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center cursor-pointer relative group">
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
                <UploadCloud className={`w-10 h-10 mb-4 ${uploading ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
                <p className="text-slate-300 font-medium">Click or Drop File</p>
                <p className="text-slate-500 text-sm mt-1">Images, Video, Audio (Max 15MB)</p>
              </div>

              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

              {lastUploaded && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg"><Check className="w-5 h-5 text-emerald-500" /></div>
                    <div className="flex-1"><h3 className="text-white font-medium">Upload Success</h3><p className="text-slate-400 text-xs">Saved to MongoDB</p></div>
                  </div>
                  <div className="flex gap-2 bg-black/30 p-2 rounded-lg border border-slate-800">
                    <input readOnly value={lastUploaded.url} className="bg-transparent flex-1 text-sm outline-none text-slate-300" />
                    <button onClick={() => navigator.clipboard.writeText(lastUploaded.url)} className="text-slate-400 hover:text-white"><Copy className="w-4 h-4" /></button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a href={lastUploaded.url} target="_blank" rel="noreferrer" className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-white transition-colors">Open File</a>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="text-white font-medium flex items-center gap-2"><Database className="w-4 h-4 text-blue-400" /> History</h3>
              {history.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors">
                  <File className="w-5 h-5 text-slate-500" />
                  <div className="flex-1 min-w-0"><p className="text-sm text-slate-300 truncate">{f.name}</p></div>
                  <button onClick={() => navigator.clipboard.writeText(f.url)} className="text-slate-500 hover:text-white"><Copy className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center"><h2 className="text-3xl font-bold text-white mb-2">API Documentation</h2><p className="text-slate-400">Simple endpoints for your apps.</p></div>
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between"><span className="text-emerald-400 font-mono text-sm">POST /api/upload</span></div>
                <div className="p-4 font-mono text-sm text-slate-300">curl -X POST {window.location.origin}/api/upload \<br/>  -F "file=@image.png"</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between"><span className="text-blue-400 font-mono text-sm">GET /u/:id</span></div>
                <div className="p-4 font-mono text-sm text-slate-300">{window.location.origin}/u/xyz123</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}



