const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Temporary storage for uploaded files
const upload = multer({ dest: 'uploads/' });

// List of available uploaders
const UPLOADERS = [
  'anonfiles',
  'bayfiles',
  'file.io',
  'gofile',
  'katfile',
  'mixdrop',
  'pixeldrain',
  'racaty',
  'transfer.sh',
  'uguu.se',
  'uploadfile',
  'vshare',
  'zippyshare'
];

// API Endpoints
app.get('/api/list', (req, res) => {
  res.json(UPLOADERS);
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploader = req.body.uploader;
    if (!UPLOADERS.includes(uploader)) {
      return res.status(400).json({ error: 'Invalid uploader' });
    }

    const result = await uploadToService(req.file.path, uploader);
    res.json(result);

    // Clean up the uploaded file
    fs.unlink(req.file.path, () => {});
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function uploadToService(filePath, uploader) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('uploader', uploader);

  const response = await axios.post('https://r-nozawa-uploader.hf.space/', form, {
    headers: form.getHeaders()
  });

  return response.data;
}

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
