import React, { useEffect, useMemo, useState } from 'react';

type FileItem = {
  id: string;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
};

const BYTES_PER_MB = 1024 * 1024;

export const App: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const apiBase = useMemo(() => (import.meta.env.VITE_API_BASE as string) || 'http://localhost:4000', []);

  async function refreshFiles() {
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/files`);
      if (!res.ok) throw new Error('Failed to load files');
      const data = await res.json();
      setFiles(data.files ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load files');
    }
  }

  useEffect(() => {
    refreshFiles();
  }, []);

  async function onUpload(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError(null);
    setSuccess(null);
    const form = ev.currentTarget;
    const input = form.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (!input || !input.files || input.files.length === 0) {
      setError('Please choose a file to upload.');
      return;
    }
    const file = input.files[0];
    if (file.size > 10 * BYTES_PER_MB) {
      setError('File too large. Max 10 MB.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      const res = await fetch(`${apiBase}/api/upload`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }
      await res.json();
      setSuccess('Upload complete.');
      input.value = '';
      await refreshFiles();
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/files/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await refreshFiles();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    }
  }

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1 className="title">File Upload & View (Demo)</h1>
          <p className="subtitle">Max file size: 10 MB</p>
        </div>
      </div>

      <div className="card uploadCard">
        <form onSubmit={onUpload} className="uploadForm">
          <input type="file" name="file" />
          <button type="submit" className="btn btn-primary" disabled={isUploading}>
            {isUploading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
      </div>

      <div className="card listCard">
        <div className="listHeader">Uploaded Files</div>
        {files.length === 0 ? (
          <div className="empty">No files uploaded yet.</div>
        ) : (
          <ul className="fileList">
            {files.map(f => (
              <li key={f.id} className="fileItem">
                <div className="fileMeta">
                  <div className="fileName">{f.originalName}</div>
                  <div className="fileSub">{(f.size / (1024 * 1024)).toFixed(2)} MB • {new Date(f.uploadedAt).toLocaleString()}</div>
                </div>
                <div className="actions">
                  <a className="btn btn-blue" href={`${apiBase}/api/files/${f.id}`}>Download</a>
                  <button type="button" className="btn btn-red" onClick={() => onDelete(f.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};


