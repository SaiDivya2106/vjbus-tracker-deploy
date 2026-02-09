import React, { useState } from 'react';
import api from '../api';
import './EditMou.css';

function EditMou({ mou, onCancel, onSaved }) {
  const [title, setTitle] = useState(mou.title || '');
  const [jsonMode, setJsonMode] = useState('text'); // default to text for quick edits
  const [mdMode, setMdMode] = useState('text');

  const [jsonFile, setJsonFile] = useState(null);
  const [mdFile, setMdFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const [jsonText, setJsonText] = useState(mou.json ? JSON.stringify(mou.json, null, 2) : '');
  const [mdText, setMdText] = useState(mou.md || '');

  const [updateTitle, setUpdateTitle] = useState(false);
  const [updateJson, setUpdateJson] = useState(!!mou.json);
  const [updateMd, setUpdateMd] = useState(!!mou.md);
  const [updatePdf, setUpdatePdf] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const onJsonFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.endsWith('.json')) {
      setMessage({ text: 'Please select a valid JSON file', type: 'error' });
      e.target.value = '';
      return;
    }
    setJsonFile(file);
    setMessage({ text: '', type: '' });
  };

  const onMdFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.endsWith('.md')) {
      setMessage({ text: 'Please select a valid Markdown file', type: 'error' });
      e.target.value = '';
      return;
    }
    setMdFile(file);
    setMessage({ text: '', type: '' });
  };

  const onPdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.endsWith('.pdf')) {
      setMessage({ text: 'Please select a valid PDF file', type: 'error' });
      e.target.value = '';
      return;
    }
    setPdfFile(file);
    setMessage({ text: '', type: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!updateTitle && !updateJson && !updateMd && !updatePdf) {
      setMessage({ text: 'Select at least one field to update', type: 'error' });
      return;
    }

    const formData = new FormData();

    if (updateTitle) {
      formData.append('title', title.trim());
    }

    if (updateJson) {
      if (jsonMode === 'file' && jsonFile) {
        formData.append('jsonFile', jsonFile);
      } else if (jsonMode === 'text') {
        if (jsonText.trim().length === 0) {
          setMessage({ text: 'JSON textarea is empty', type: 'error' });
          return;
        }
        try {
          JSON.parse(jsonText);
        } catch (e) {
          setMessage({ text: 'Invalid JSON in textarea', type: 'error' });
          return;
        }
        formData.append('jsonText', jsonText);
      }
    }

    if (updateMd) {
      if (mdMode === 'file' && mdFile) {
        formData.append('mdFile', mdFile);
      } else if (mdMode === 'text') {
        if (mdText.trim().length === 0) {
          setMessage({ text: 'Markdown textarea is empty', type: 'error' });
          return;
        }
        formData.append('mdText', mdText);
      }
    }

    if (updatePdf) {
      if (!pdfFile) {
        setMessage({ text: 'Please select a PDF file', type: 'error' });
        return;
      }
      formData.append('pdfFile', pdfFile);
    }

    if (!Array.from(formData.keys()).length) {
      setMessage({ text: 'No changes to update', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/mou/${mou.prefix}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ text: 'MoU updated successfully', type: 'success' });
      setTimeout(() => onSaved && onSaved(), 800);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update MoU';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-mou-container">
      <div className="edit-card">
        <div className="edit-header">
          <button className="btn-back" onClick={onCancel}>← Back</button>
          <h2>Edit MoU: {mou.prefix}</h2>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSave}>
          <div className="section">
            <div className="section-title">
              <label>
                <input type="checkbox" checked={updateTitle} onChange={(e) => setUpdateTitle(e.target.checked)} />
                <span> Update Title</span>
              </label>
            </div>

            {updateTitle && (
              <div className="section-body">
                <input
                  type="text"
                  className="title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title (max 70 characters)"
                  maxLength={70}
                />
                <small>{title.length}/70 characters</small>
              </div>
            )}
          </div>

          <div className="section">
            <div className="section-title">
              <label>
                <input type="checkbox" checked={updateJson} onChange={(e) => setUpdateJson(e.target.checked)} />
                <span> Update JSON</span>
              </label>
            </div>

            {updateJson && (
              <div className="section-body">
                <div className="input-mode-switch">
                  <button type="button" className={jsonMode === 'file' ? 'active' : ''} onClick={() => setJsonMode('file')}>Attach File</button>
                  <button type="button" className={jsonMode === 'text' ? 'active' : ''} onClick={() => setJsonMode('text')}>Paste Text</button>
                </div>

                {jsonMode === 'file' ? (
                  <input type="file" accept=".json" onChange={onJsonFileChange} />
                ) : (
                  <textarea className="big-textarea" rows={14} value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder="Paste JSON here..." />
                )}
              </div>
            )}
          </div>

          <div className="section">
            <div className="section-title">
              <label>
                <input type="checkbox" checked={updateMd} onChange={(e) => setUpdateMd(e.target.checked)} />
                <span> Update Markdown</span>
              </label>
            </div>

            {updateMd && (
              <div className="section-body">
                <div className="input-mode-switch">
                  <button type="button" className={mdMode === 'file' ? 'active' : ''} onClick={() => setMdMode('file')}>Attach File</button>
                  <button type="button" className={mdMode === 'text' ? 'active' : ''} onClick={() => setMdMode('text')}>Paste Text</button>
                </div>

                {mdMode === 'file' ? (
                  <input type="file" accept=".md" onChange={onMdFileChange} />
                ) : (
                  <textarea className="big-textarea" rows={14} value={mdText} onChange={(e) => setMdText(e.target.value)} placeholder="Paste Markdown here..." />
                )}
              </div>
            )}
          </div>

          <div className="section">
            <div className="section-title">
              <label>
                <input type="checkbox" checked={updatePdf} onChange={(e) => setUpdatePdf(e.target.checked)} />
                <span> Update PDF</span>
              </label>
            </div>

            {updatePdf && (
              <div className="section-body">
                <input type="file" accept=".pdf" onChange={onPdfFileChange} />
                {pdfFile && <div className="file-info">✓ Selected: {pdfFile.name}</div>}
                {mou.pdfUrl && !pdfFile && <small>Current: {mou.prefix}.pdf (select new file to replace)</small>}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMou;
