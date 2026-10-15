'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import AppTopbar from '@/components/AppTopbar';

const EMPTY_FORM = { object_label: '', waste_category: 'review', confidence: 0, estimated_weight: 0.5, current_stage: 'collection', source: 'manual' };

export default function ScannerPage() {
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const previewUrlRef = useRef('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [detectionSource, setDetectionSource] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [confirmedForm, setConfirmedForm] = useState(EMPTY_FORM);

  const analyzeFile = async (file) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(file);
    setPreviewUrl(previewUrlRef.current);
    setDetectedObjects([]);
    setSelectedObject(null);
    setDetectionSource('');
    setMessage('');
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      const data = await api.detectWaste(formData);
      setDetectedObjects(data.objects || []);
      setDetectionSource(data.source || '');
      if ((data.objects || []).length > 0) {
        const first = data.objects[0];
        setSelectedObject(first);
        setConfirmedForm({
          object_label: first.label,
          waste_category: first.category || 'review',
          confidence: first.confidence ?? 0,
          estimated_weight: 0.5,
          current_stage: 'collection',
          source: first.source || data.source || 'model',
        });
      }
      if (data.source === 'unavailable') {
        setMessage(data.message || 'The detector is not ready. You can classify and track this item manually.');
      } else if (!data.objects?.length) {
        setMessage('No objects passed the detector confidence threshold. You can classify and track an item manually.');
      } else {
        setMessage(data.source === 'model' ? 'Model predictions are shown for review. This general-purpose model may not recognize waste correctly.' : 'Detection returned results; check the source label before confirming.');
      }
    } catch (error) {
      setMessage(error.message || 'Detection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type) || file.name.match(/\.(jpg|jpeg|png)$/i);
    if (!validType) {
      setMessage('Unsupported file type. Use JPG, JPEG, or PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Image file is too large. Use a file under 10MB.');
      return;
    }
    await analyzeFile(file);
  };

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Live camera is not available in this browser or origin. Use localhost or HTTPS and upload a photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      const messages = {
        NotAllowedError: 'Camera access was denied. Allow camera permissions in the browser or upload a photo.',
        NotFoundError: 'No camera was found on this device. You can upload a photo instead.',
        NotReadableError: 'The camera is already in use by another app.',
      };
      setCameraError(messages[error.name] || `Could not start the camera: ${error.message}`);
    }
  };

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraOn(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is starting. Wait a moment and try again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      setCameraError('Could not capture a photo from this camera.');
      return;
    }
    const photo = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
    stopCamera();
    await analyzeFile(photo);
  };

  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const payload = {
        object_label: confirmedForm.object_label,
        waste_category: confirmedForm.waste_category,
        confidence: Number(confirmedForm.confidence),
        estimated_weight: Number(confirmedForm.estimated_weight),
        current_stage: confirmedForm.current_stage,
        source: confirmedForm.source || 'manual',
      };
      await api.createMaterial(payload);
      setMessage('Material saved to the backend database.');
      setConfirmedForm(EMPTY_FORM);
      setDetectedObjects([]);
      setPreviewUrl('');
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
      setSelectedObject(null);
      setDetectionSource('');
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setMessage(error.message || 'Could not save material.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-badge">S</div>
          <div><div style={{fontWeight:800}}>Smart Recycling</div><small>Assistant</small></div>
        </div>
        <nav>
          <a href="/dashboard" className="nav-link">Dashboard</a>
          <a href="/scanner" className="nav-link active">Waste Scanner</a>
          <a href="/digital-twin" className="nav-link">Digital Twin</a>
          <a href="/ai-assistant" className="nav-link">EcoGuide AI</a>
          <a href="/analytics" className="nav-link">Analytics</a>
        </nav>
      </aside>
      <main className="main-panel">
        <AppTopbar title="Waste scanner" subtitle="Inspect, classify, and track" />
        <div className="grid-two" style={{ marginTop: 20 }}>
          <div className="card chart-box">
            <div style={{ marginBottom: 14, color: '#475569', lineHeight: 1.55 }}>
              Upload a clear photo for general object detection. Material type and recyclability are not guaranteed by a general YOLO model—please review every result.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <label className="btn btn-primary" htmlFor="waste-upload" style={{ margin: 0 }}>
                Upload image
              </label>
              <input id="waste-upload" ref={inputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/*" capture="environment" onChange={handleImageSelect} style={{ display: 'none' }} />
              {!cameraOn ? (
                <button type="button" className="btn btn-secondary" onClick={startCamera}>Open live camera</button>
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={capturePhoto}>Capture &amp; scan</button>
                  <button type="button" className="btn btn-ghost" onClick={stopCamera}>Close camera</button>
                </>
              )}
              <span style={{ color: '#64748b' }}>JPG, JPEG, PNG only</span>
            </div>
            <div className="camera-preview" style={{ display: cameraOn ? 'block' : 'none' }}>
              <video ref={videoRef} autoPlay muted playsInline aria-label="Live camera preview" />
              <span className="camera-live"><i /> LIVE</span>
            </div>
            {cameraError && <div className="review-warning" role="alert" style={{ marginTop: 12 }}>{cameraError}</div>}
            {previewUrl && (
              <div style={{ position: 'relative', marginTop: 16, overflow: 'hidden', borderRadius: 18, border: '1px solid #dbeafe' }}>
                <img src={previewUrl} alt="Waste upload preview" style={{ width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0 }}>
                  {detectedObjects.map((item, index) => {
                    const [x1, y1, x2, y2] = item.bbox_normalized || [0, 0, 0, 0];
                    const width = Math.max(0, x2 - x1);
                    const height = Math.max(0, y2 - y1);
                    return (
                      <div key={`${item.label}-${index}`} style={{ position: 'absolute', left: `${x1 * 100}%`, top: `${y1 * 100}%`, width: `${width * 100}%`, height: `${height * 100}%`, border: '2px solid #10b981', borderRadius: 8, background: 'rgba(16, 185, 129, 0.09)' }}>
                        <span style={{ position: 'absolute', top: -22, left: 0, background: '#065f46', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {loading && <div style={{ marginTop: 16 }}>Scanning image...</div>}
            {message && <div style={{ marginTop: 16, color: '#0f172a' }}>{message}</div>}
            {detectionSource && <div className="source-pill" style={{ marginTop: 12 }}><span className="source-dot" />Detection source: {detectionSource === 'model' ? 'YOLO model' : detectionSource}</div>}
          </div>

          <div className="card chart-box">
            <div className="panel-header">
              <div><h3>Review predictions</h3><small style={{ color: '#64748b' }}>Confirm or correct before saving</small></div>
              {!selectedObject && <button className="btn btn-ghost" type="button" onClick={() => {
                setSelectedObject({ label: 'Unclassified item', category: 'review', confidence: 0, source: 'manual' });
                setConfirmedForm({ ...EMPTY_FORM, object_label: 'Unclassified item' });
              }}>Add item manually</button>}
            </div>
            {detectedObjects.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {detectedObjects.map((item, index) => (
                  <button
                    key={`${item.label}-${index}`}
                    className="btn btn-ghost"
                    style={{ justifyContent: 'flex-start', width: '100%' }}
                    onClick={() => {
                      setSelectedObject(item);
                      setConfirmedForm({
                        object_label: item.label,
                        waste_category: item.category || 'review',
                        confidence: item.confidence ?? 0,
                        estimated_weight: 0.5,
                        current_stage: 'collection',
                        source: item.source || detectionSource || 'model',
                      });
                    }}
                  >
                    {item.label} — {item.confidence?.toFixed ? `${(item.confidence * 100).toFixed(0)}%` : item.confidence} • {item.category === 'review' ? 'needs review' : item.category}
                  </button>
                ))}
              </div>
            ) : <p>{previewUrl ? 'No model predictions. Add an item manually if you know what it is.' : 'Upload an image to start, or add an item manually.'}</p>}

            {selectedObject && (
              <div style={{ marginTop: 18 }}>
                {confirmedForm.confidence < 0.6 && (
                  <div className="review-warning">Low or unavailable confidence. Please verify the item and category yourself before tracking.</div>
                )}
                <div className="form-field">
                  <label>Object label</label>
                  <input className="input" value={confirmedForm.object_label} onChange={(e) => setConfirmedForm({ ...confirmedForm, object_label: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Category</label>
                  <select className="input" value={confirmedForm.waste_category} onChange={(e) => setConfirmedForm({ ...confirmedForm, waste_category: e.target.value })}>
                    <option value="recyclable">Recyclable</option>
                    <option value="reusable">Reusable</option>
                    <option value="biodegradable">Biodegradable</option>
                    <option value="hazardous">Hazardous</option>
                    <option value="review">Review</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Confidence</label>
                  <input className="input" type="number" step="0.01" min="0" max="1" value={confirmedForm.confidence} onChange={(e) => setConfirmedForm({ ...confirmedForm, confidence: Number(e.target.value) })} />
                </div>
                <div className="form-field">
                  <label>Estimated weight (kg)</label>
                  <input className="input" type="number" step="0.1" value={confirmedForm.estimated_weight} onChange={(e) => setConfirmedForm({ ...confirmedForm, estimated_weight: Number(e.target.value) })} />
                </div>
                <div className="form-field">
                  <label>Current stage</label>
                  <select className="input" value={confirmedForm.current_stage} onChange={(e) => setConfirmedForm({ ...confirmedForm, current_stage: e.target.value })}>
                    <option value="collection">Collection</option>
                    <option value="sorting">Sorting</option>
                    <option value="processing">Processing</option>
                    <option value="recovery">Recovery</option>
                  </select>
                </div>
                <div className="confidence-row"><span>Confidence</span><strong>{Math.round(Number(confirmedForm.confidence || 0) * 100)}%</strong></div>
                <button className="btn btn-primary" disabled={loading || !confirmedForm.object_label.trim()} onClick={handleConfirm}>Confirm and Track</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
