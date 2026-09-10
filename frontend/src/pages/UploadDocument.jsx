import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFormattedFolderList } from '../utils/folderUtils';

export default function UploadDocument() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('PDF');
  const [file, setFile] = useState(null);
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    api.get('/folders').then(res => {
      if (res.data.success) setFolders(res.data.folders);
    }).catch(err => console.error(err));
  }, []);

  const isRahulDey = user?.role_name === 'RAHEE_ADMIN_REVIEWER' || user?.email?.toLowerCase() === 'rahul.d@rahee.com';

  if (user?.is_super_admin || isRahulDey) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Document Upload Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {isRahulDey 
            ? 'As Stage 1 Admin Reviewer (Rahul Dey), your role is dedicated to Document Review & Approval. Initial document uploading is strictly reserved for designated Document Uploaders (Om Jha).'
            : 'As a Super Admin, your role is dedicated to cross-tenant User Management & System Governance. Document uploading is restricted to operational Uploaders within Company 1 and Company 2.'
          }
        </p>
        <Link
          to="/documents"
          className="inline-block px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
        >
          Return to Document Repository
        </Link>
      </div>
    );
  }

  const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.js', '.msi', '.vbs', '.dll'];

  const handleFileChange = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const rawName = selectedFile.name;
    const lastDotIndex = rawName.lastIndexOf('.');
    const ext = lastDotIndex !== -1 ? rawName.slice(lastDotIndex).toLowerCase() : '';

    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      setError(`Security Alert: Executable file types (${ext}) are strictly prohibited.`);
      setFile(null);
      return;
    }

    // 1. Auto-populate Document Title from selected file name (clean filename without extension)
    const cleanTitle = lastDotIndex !== -1 ? rawName.slice(0, lastDotIndex).replace(/_/g, ' ') : rawName;
    setTitle(cleanTitle);

    const rawExt = ext.replace('.', '').toUpperCase();
    const extTypeMap = {
      PDF: 'PDF',
      DOC: 'WORD',
      DOCX: 'WORD',
      XLS: 'EXCEL',
      XLSX: 'EXCEL',
      PPT: 'POWERPOINT',
      PPTX: 'POWERPOINT',
      JPG: 'IMAGE',
      JPEG: 'IMAGE',
      PNG: 'IMAGE',
      WEBP: 'IMAGE',
      SVG: 'IMAGE'
    };

    const detectedType = extTypeMap[rawExt];
    if (!detectedType) {
      setError(`Unsupported File Format (${ext}). Only PDF, Microsoft Word, Microsoft Excel, Microsoft PowerPoint, and Images are supported.`);
      setFile(null);
      return;
    }

    const typeLabels = {
      PDF: 'PDF Document',
      WORD: 'Microsoft Word',
      EXCEL: 'Microsoft Excel',
      POWERPOINT: 'Microsoft PowerPoint',
      IMAGE: 'Image'
    };

    // Strict Type Mismatch Validation Check against User's Selected Dropdown Option
    if (documentType !== detectedType) {
      const selectedLabel = typeLabels[documentType] || documentType;
      const detectedLabel = typeLabels[detectedType] || detectedType;
      setError(`Validation Error: You selected '${selectedLabel}', but uploaded a ${detectedLabel} file (${ext}). Please select '${detectedLabel}' in the dropdown or attach a matching file.`);
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const getAcceptString = (type) => {
    switch (type) {
      case 'PDF':
        return '.pdf,application/pdf';
      case 'WORD':
        return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'EXCEL':
        return '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'POWERPOINT':
        return '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'IMAGE':
        return '.jpg,.jpeg,.png,.webp,.svg,image/*';
      default:
        return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp';
    }
  };

  const handleTypeChange = (newType) => {
    setDocumentType(newType);
    setError('');
    // Auto-clear file if mismatched with newly selected type
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      const rawExt = ext.toUpperCase();
      const extTypeMap = {
        PDF: 'PDF',
        DOC: 'WORD',
        DOCX: 'WORD',
        XLS: 'EXCEL',
        XLSX: 'EXCEL',
        PPT: 'POWERPOINT',
        PPTX: 'POWERPOINT',
        JPG: 'IMAGE',
        JPEG: 'IMAGE',
        PNG: 'IMAGE',
        WEBP: 'IMAGE',
        SVG: 'IMAGE'
      };
      const detectedType = extTypeMap[rawExt];
      if (detectedType && newType !== detectedType) {
        setFile(null);
        setTitle('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a valid document file to upload.');
      return;
    }

    // Type Mismatch Validation Check
    const ext = file.name.split('.').pop().toUpperCase();
    const extTypeMap = {
      PDF: 'PDF',
      DOC: 'WORD',
      DOCX: 'WORD',
      XLS: 'EXCEL',
      XLSX: 'EXCEL',
      PPT: 'POWERPOINT',
      PPTX: 'POWERPOINT',
      JPG: 'IMAGE',
      JPEG: 'IMAGE',
      PNG: 'IMAGE',
      WEBP: 'IMAGE',
      SVG: 'IMAGE'
    };
    const detectedType = extTypeMap[ext];
    if (!detectedType) {
      setError(`Unsupported File Format (.${ext.toLowerCase()}). Only PDF, Microsoft Word, Microsoft Excel, Microsoft PowerPoint, and Images are supported.`);
      return;
    }

    const typeLabels = {
      PDF: 'PDF Document',
      WORD: 'Microsoft Word',
      EXCEL: 'Microsoft Excel',
      POWERPOINT: 'Microsoft PowerPoint',
      IMAGE: 'Image'
    };

    if (documentType !== detectedType) {
      const selectedLabel = typeLabels[documentType] || documentType;
      const detectedLabel = typeLabels[detectedType] || detectedType;
      setError(`Validation Error: You selected '${selectedLabel}', but attached a ${detectedLabel} file (.${ext.toLowerCase()}). Please select '${detectedLabel}' in the dropdown or attach a matching file.`);
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('document_type', documentType);
    if (folderId) formData.append('folder_id', folderId);
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setLoading(false);
      if (res.data.success) {
        navigate(`/documents/${res.data.documentId}`);
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to upload document.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/documents" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Upload New Document</h1>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Q3 Financial Audit Report - Rahee Infratech"
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Document Type, Folder & Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                <option value="PDF">📄 PDF Document (.pdf)</option>
                <option value="WORD">📝 Microsoft Word (.doc, .docx)</option>
                <option value="EXCEL">📊 Microsoft Excel (.xls, .xlsx)</option>
                <option value="POWERPOINT">📊 Microsoft PowerPoint (.ppt, .pptx)</option>
                <option value="IMAGE">🖼️ Image (.jpg, .png, .webp, .svg)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Target Folder (Optional)
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
              >
                <option value="">📁 None (Root Directory)</option>
                {getFormattedFolderList(folders).map(f => (
                  <option key={f.id} value={f.id}>
                    {f.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Description / Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional submission context..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Document File <span className="text-rose-500">*</span>
            </label>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer ${
                dragActive ? 'border-blue-500 bg-blue-50' : file ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-300 hover:border-blue-400 bg-slate-50'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                onChange={(e) => handleFileChange(e.target.files[0])}
                className="hidden"
                accept={getAcceptString(documentType)}
              />

              <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                {file ? (
                  <div className="space-y-1">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-900 text-sm">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB &bull; Ready for upload</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-800 text-sm">Click to select or drag & drop document file here</p>
                    <p className="text-xs text-slate-500">
                      Supported Formats: <strong>PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Images</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 italic">Max file size: 25 MB. Executables strictly prohibited.</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <Link
              to="/documents"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition"
            >
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
