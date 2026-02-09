import React, { useState } from 'react';
import api from '../api';
import './UploadForm.css';

function UploadForm({ onSuccess }) {
  const [prefix, setPrefix] = useState('');
  const [title, setTitle] = useState('');
  const [jsonMode, setJsonMode] = useState('file'); // 'file' | 'text'
  const [mdMode, setMdMode] = useState('file'); // 'file' | 'text'
  const [jsonFile, setJsonFile] = useState(null);
  const [mdFile, setMdFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [jsonText, setJsonText] = useState('');
  const [mdText, setMdText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prefix.trim()) {
      setMessage({ text: 'Please enter a prefix name', type: 'error' });
      return;
    }

    const hasJson = (jsonMode === 'file' && jsonFile) || (jsonMode === 'text' && jsonText.trim().length > 0);
    const hasMd = (mdMode === 'file' && mdFile) || (mdMode === 'text' && mdText.trim().length > 0);
    const hasPdf = pdfFile;
    
    if (!hasJson && !hasMd && !hasPdf) {
      setMessage({ text: 'Please provide at least one: JSON, Markdown, or PDF', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('prefix', prefix.trim());
    
    if (title.trim()) {
      formData.append('title', title.trim());
    }
    
    if (jsonMode === 'file' && jsonFile) {
      formData.append('jsonFile', jsonFile);
    } else if (jsonMode === 'text' && jsonText.trim().length > 0) {
      // Validate JSON client-side
      try {
        JSON.parse(jsonText);
      } catch (e) {
        setMessage({ text: 'Invalid JSON in textarea', type: 'error' });
        return;
      }
      formData.append('jsonText', jsonText);
    }

    if (mdMode === 'file' && mdFile) {
      formData.append('mdFile', mdFile);
    } else if (mdMode === 'text' && mdText.trim().length > 0) {
      formData.append('mdText', mdText);
    }

    if (pdfFile) {
      formData.append('pdfFile', pdfFile);
    }

    setUploading(true);
    setMessage({ text: '', type: '' });
    // Debug: Log the API URL (will be visible in browser console)
console.log('🔧 API Configuration:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  
  NODE_ENV: process.env.NODE_ENV
});


    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage({ 
        text: `Success! Uploaded: ${response.data.files.join(', ')}`, 
        type: 'success' 
      });
      
      // Reset form
      setPrefix('');
      setTitle('');
      setJsonFile(null);
      setMdFile(null);
      setPdfFile(null);
      setJsonText('');
      setMdText('');      // Reset file inputs
      const jf = document.getElementById('jsonFile');
      if (jf) jf.value = '';
      const mf = document.getElementById('mdFile');
      if (mf) mf.value = '';
      const pf = document.getElementById('pdfFile');
      if (pf) pf.value = '';      // Call success callback
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to upload files';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleJsonFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.endsWith('.json')) {
      setMessage({ text: 'Please select a valid JSON file', type: 'error' });
      e.target.value = '';
      return;
    }
    setJsonFile(file);
    setMessage({ text: '', type: '' });
  };

  const handleMdFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.endsWith('.md')) {
      setMessage({ text: 'Please select a valid Markdown file', type: 'error' });
      e.target.value = '';
      return;
    }
    setMdFile(file);
    setMessage({ text: '', type: '' });
  };

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.endsWith('.pdf')) {
      setMessage({ text: 'Please select a valid PDF file', type: 'error' });
      e.target.value = '';
      return;
    }
    setPdfFile(file);
    setMessage({ text: '', type: '' });
  };

  return (
    <div className="upload-form-container">
      <div className="upload-card">
        <h2>Upload MoU Files</h2>
        <p className="subtitle">Upload JSON and/or Markdown files for a new MoU</p>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="prefix">
              Prefix Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g., mou1, mou2, nitraipur_vnrvjiet"
              pattern="[a-zA-Z0-9_]+"
              title="Only letters, numbers, and underscores are allowed"
              required
            />
            <small>Files will be saved as: {prefix || 'prefix'}.json, {prefix || 'prefix'}.md, {prefix || 'prefix'}.pdf</small>
          </div>

          <div className="form-group">
            <label htmlFor="title">
              Title (Optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for this MoU"
              maxLength={70}
            />
            <small>{title.length}/70 characters</small>
          </div>

          <div className="form-group">
            <label>
              JSON Input
            </label>
            <div className="input-mode-switch">
              <button type="button" className={jsonMode === 'file' ? 'active' : ''} onClick={() => setJsonMode('file')}>Attach File</button>
              <button type="button" className={jsonMode === 'text' ? 'active' : ''} onClick={() => setJsonMode('text')}>Paste Text</button>
            </div>

            {jsonMode === 'file' ? (
              <>
                <input
                  type="file"
                  id="jsonFile"
                  accept=".json"
                  onChange={handleJsonFileChange}
                />
                {jsonFile && (
                  <div className="file-info">✓ Selected: {jsonFile.name}</div>
                )}
              </>
            ) : (
              <>
                <textarea
                  className="big-textarea"
                  placeholder="Paste JSON content here..."
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={12}
                />
                <small>Tip: Ensure this is valid JSON (we validate before upload).</small>
              </>
            )}
          </div>

          <div className="form-group">
            <label>
              Markdown Input
            </label>
            <div className="input-mode-switch">
              <button type="button" className={mdMode === 'file' ? 'active' : ''} onClick={() => setMdMode('file')}>Attach File</button>
              <button type="button" className={mdMode === 'text' ? 'active' : ''} onClick={() => setMdMode('text')}>Paste Text</button>
            </div>

            {mdMode === 'file' ? (
              <>
                <input
                  type="file"
                  id="mdFile"
                  accept=".md"
                  onChange={handleMdFileChange}
                />
                {mdFile && (
                  <div className="file-info">✓ Selected: {mdFile.name}</div>
                )}
              </>
            ) : (
              <>
                <textarea
                  className="big-textarea"
                  placeholder="Paste Markdown content here..."
                  value={mdText}
                  onChange={(e) => setMdText(e.target.value)}
                  rows={12}
                />
              </>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pdfFile">
              PDF File (Optional)
            </label>
            <input
              type="file"
              id="pdfFile"
              accept=".pdf"
              onChange={handlePdfFileChange}
            />
            {pdfFile && (
              <div className="file-info">✓ Selected: {pdfFile.name}</div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={uploading}
            >
              {uploading ? '⏳ Uploading...' : '⬆️ Upload Files'}
            </button>
          </div>
        </form>

        <div className="info-box">
          <h3>📝 Instructions:</h3>
          <ul>
            <li>Enter a unique prefix name for your MoU files</li>
            <li>Optionally add a title (up to 70 characters)</li>
            <li>Upload at least one: JSON, Markdown, or PDF file</li>
            <li>For JSON/Markdown: choose to attach file or paste text</li>
            <li>All files will be saved with the same prefix name</li>
            <li>Prefix can only contain letters, numbers, and underscores</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UploadForm;
