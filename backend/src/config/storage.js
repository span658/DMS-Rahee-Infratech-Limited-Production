const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed File Extensions and MIME Types
const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/vnd.dxf': '.dxf',
  'application/dxf': '.dxf',
  'application/dwg': '.dwg',
  'image/vnd.dwg': '.dwg',
  'model/stl': '.stl',
  'application/sla': '.stl',
  'model/obj': '.obj',
  'application/step': '.step',
  'application/iges': '.iges'
};

const CAD_EXTENSIONS = ['.dwg', '.dxf', '.stl', '.obj', '.step', '.stp', '.iges'];

const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.js', '.msi', '.vbs', '.com', '.scr', '.pif', '.dll', '.jar'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // 1. Strict Executable Check
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Security Alert: Executable file type '${ext}' is strictly prohibited.`), false);
  }

  // 2. Format validation
  const isValidMime = ALLOWED_MIME_TYPES[file.mimetype];
  const isAllowedExt = Object.values(ALLOWED_MIME_TYPES).includes(ext);
  const isCadExt = CAD_EXTENSIONS.includes(ext);

  if (isValidMime || isAllowedExt || isCadExt) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid document format (${ext}). Supported formats: PDF, Word, Excel, PowerPoint, Images, and CAD files (.dwg, .dxf, .stl, .obj, .step, .stp, .iges).`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
  // No artificial file size limits — storage is bounded only by available disk space
});

// Helper function to calculate SHA-256 file hash
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

module.exports = {
  upload,
  uploadDir,
  calculateFileHash,
  ALLOWED_MIME_TYPES
};
