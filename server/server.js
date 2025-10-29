import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime-types';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: false }));
app.use(express.json());

const dataDir = path.join(__dirname, 'uploads');
const manifestPath = path.join(__dirname, 'manifest.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(manifestPath)) {
  fs.writeFileSync(manifestPath, JSON.stringify({ files: [] }, null, 2));
}

function readManifest() {
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw);
}

function writeManifest(manifest) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dataDir),
    filename: (_req, file, cb) => {
      const id = nanoid();
      const ext = path.extname(file.originalname) || '';
      cb(null, `${id}${ext}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const id = path.parse(req.file.filename).name;
  const manifest = readManifest();
  const entry = {
    id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype,
    uploadedAt: new Date().toISOString()
  };
  manifest.files.unshift(entry);
  writeManifest(manifest);
  res.status(201).json(entry);
});

app.get('/api/files', (_req, res) => {
  const manifest = readManifest();
  res.json({ files: manifest.files });
});

app.get('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const manifest = readManifest();
  const file = manifest.files.find(f => f.id === id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  const filePath = path.join(dataDir, file.storedName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  const contentType = mime.lookup(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  fs.createReadStream(filePath).pipe(res);
});

app.delete('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const manifest = readManifest();
  const idx = manifest.files.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: 'File not found' });
  const file = manifest.files[idx];
  const filePath = path.join(dataDir, file.storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  manifest.files.splice(idx, 1);
  writeManifest(manifest);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


