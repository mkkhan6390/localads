import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { 
  Button, 
  Modal, 
  Form, 
  Container, 
  Row, 
  Col, 
  Alert, 
  Spinner 
} from 'react-bootstrap';
import { 
  BsUpload, BsCheck2Circle, BsImage, BsTag, BsLayers, 
  BsPencilSquare, BsCardText, BsGeoAlt, BsCheck 
} from 'react-icons/bs';

// Allowed creative formats: [width, height, label]
const ALLOWED_SPECS = [
  { w: 1200, h: 628, label: 'Horizontal 16:9 (1200×628, web banners)' },
  { w: 1080, h: 1080, label: 'Square 1:1 (1080×1080, feed ads)' },
  { w: 1080, h: 1920, label: 'Vertical 9:16 (1080×1920, stories)' },
];

// Reads an image file's pixel dimensions and checks against ALLOWED_SPECS
function checkImageSpecs(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const { width, height } = img;
      URL.revokeObjectURL(url);
      const match = ALLOWED_SPECS.find(s => s.w === width && s.h === height);
      resolve({ valid: !!match, width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, width: 0, height: 0 });
    };
    img.src = url;
  });
}

function NewAdModal(props) {

  const initialFormState = {
    file: null,
    userid: '',
    title: '',
    description: '',
    pincode: '',
    displaylevel: '',
    type: ''
  };

  const [formValues, setFormValues] = useState(initialFormState);
  const [existingImageUrl, setExistingImageUrl] = useState(''); // current ad image in edit mode

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingAd, setFetchingAd] = useState(false); // loading state while fetching ad data
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Multi-step wizard state tracker
  const fileInputRef = useRef(null);

  // Safely extract the ad ID whether props.selectedAd is an object or primitive ID
  const adId = typeof props.selectedAd === 'object' && props.selectedAd !== null 
    ? props.selectedAd.id 
    : props.selectedAd;

  // Evaluates to true if adId exists and is valid
  const isEditMode = Boolean(adId && Number(adId) > 0);

  useEffect(() => {
    if (props.showNewAdModal) {
      // Reset state when modal opens
      setSuccess(false);
      setErrorMessage('');
      setErrors({});
      setExistingImageUrl('');
      setCurrentStep(1);

      if (isEditMode) {
        // Edit mode: fetch existing ad data and populate the form
        setFetchingAd(true);
        async function getAdById() {
          try {
            const token = localStorage.getItem("token");
            const response = await api.get(`http://localhost:5000/ad/ad/${adId}`, {
              headers: { authorization: `Bearer ${token}` },
            });
            const ad = response.data;
            setFormValues({
              file: null,
              userid: ad.owner_id || '',
              title: ad.title || '',
              description: ad.description || '',
              pincode: ad.pincode || '',
              // DB column is "display_level", map it to form field "displaylevel"
              displaylevel: ad.display_level?.toString() || ad.displaylevel?.toString() || '',
              type: ad.type || ''
            });
            // Store the existing image URL so we can show a preview
            if (ad.ad_url) {
              setExistingImageUrl(ad.ad_url);
            }
          } catch (err) {
            console.error("Failed to fetch ad for editing:", err);
            setErrorMessage('Failed to load ad details for editing.');
          } finally {
            setFetchingAd(false);
          }
        }
        getAdById();
      } else {
        // Create mode: reset form to blank
        setFormValues(initialFormState);
        setExistingImageUrl('');
        setFetchingAd(false);
      }
    }
  }, [props.showNewAdModal, props.selectedAd]);

  const validateForm = () => {
    const newErrors = {};
    if (!formValues.type) newErrors.type = 'Please select an ad type.';
    // File is required only for new ads, not when editing (existing image stays)
    if (!formValues.file && !isEditMode) newErrors.file = 'Please upload a file.';
    if (!formValues.title) newErrors.title = 'Title is required.';
    if (!formValues.description) newErrors.description = 'Description is required.';
    if (!/^[1-9][0-9]{5}$/.test(formValues.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode.';
    if (!formValues.displaylevel) newErrors.displaylevel = 'Please select a display level.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'file' && files && files[0]) {
      setFormValues((prev) => ({
        ...prev,
        file: files[0],
      }));
      // When user picks a new file, clear existing image preview
      setExistingImageUrl('');
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const token = localStorage.getItem("token");
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

          const response = await api.get(`${API_URL}/ad/reverse-geocode`, {
            params: { lat: latitude, long: longitude },
            headers: { authorization: `Bearer ${token}` },
          });

          if (response.data?.pincode) {
            setFormValues((prev) => ({ ...prev, pincode: response.data.pincode }));
            setErrors((prev) => ({ ...prev, pincode: '' }));
          } else {
            setErrorMessage('Could not determine pincode for your location');
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          setErrorMessage('Could not determine pincode for your location');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setErrorMessage('Unable to access your location. Please enter the pincode manually.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setSuccess(false);
    setErrorMessage('');
    
    if (!validateForm()) return;
    
    // File is required only for new ads
    if (!formValues.file && !isEditMode) {
      setErrorMessage('Please select an image file');
      return;
    }
    
    // Validate file if one is selected (both create and edit)
    if (formValues.file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(formValues.file.type)) {
        setErrorMessage('Only JPEG, PNG, and WebP images are allowed');
        return;
      }
      
      if (formValues.file.size > maxSize) {
        setErrorMessage('File size must be less than 5MB');
        return;
      }

      // Enforce required creative dimensions (16:9, 1:1, or 9:16)
      const specCheck = await checkImageSpecs(formValues.file);
      if (!specCheck.valid) {
        setErrorMessage(
          `Image dimensions are invalid. Required: 1200×628, 1080×1080, or 1080×1920 px. ` +
          `Your image is ${specCheck.width}×${specCheck.height}px.`
        );
        return;
      }
    }
    
    setLoading(true);
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userid");

    const formData = new FormData();
    
    formData.append('type', formValues.type);
    formData.append('title', formValues.title);
    formData.append('description', formValues.description);
    formData.append('pincode', formValues.pincode);
    formData.append('displaylevel', formValues.displaylevel);
    formData.append('userid', userId);
    
    // Only append file if user selected a new one
    if (formValues.file) {
      formData.append('file', formValues.file);
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      let response;
      if (isEditMode) {
        // UPDATE the existing ad
        response = await api.put(`${API_URL}/ad/update/${adId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: `Bearer ${token}`,
          },
        });
      } else {
        // CREATE a new ad
        response = await api.post(`${API_URL}/ad/create`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            authorization: `Bearer ${token}`,
          },
        });
      }
   
      const { success: isSuccess } = response.data;
      if (isSuccess) {
        setSuccess(true);
        setTimeout(() => {
          if (props.onSuccess) props.onSuccess(); // refresh dashboard list
          props.setShowNewAdModal(false);
          setFormValues(initialFormState);
          setExistingImageUrl('');
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting ad:", error);
      setErrorMessage('Failed to save ad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Image preview: show new file preview OR existing ad image
  const imagePreviewUrl = formValues.file
    ? URL.createObjectURL(formValues.file)
    : existingImageUrl;

  return (
    <Modal 
      show={props.showNewAdModal} 
      onHide={() => props.setShowNewAdModal(false)}
      centered
      size="xl"
      contentClassName="newad-modal-content"
    >
      {/* Scoped styles: 16px rounded corners + gradient button */}
      <style>{`
        .newad-modal-content { border-radius: 16px; overflow: hidden; background: #ffffff; }
        .gradient-btn { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border: none; }
        .gradient-btn:hover { background: linear-gradient(135deg, #4f46e5 100%, #4338ca 100%); }
        .dropzone { border: 2px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; text-align: center; padding: 20px; cursor: pointer; }
        .dropzone.active { border-color: #6366f1; background: #eef2ff; }
        .preview-pane { background: #f8fafc; border-left: 2px solid #f1f5f9; min-height: 480px; }
      `}</style>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit Advertisement' : 'Create New Advertisement'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {success && (
          <Alert variant="success" className="m-3 d-flex align-items-center">
            <BsCheck2Circle className="me-2" /> Advertisement {isEditMode ? 'updated' : 'created'} successfully![cite: 3]
          </Alert>
        )}
        {errorMessage &&
         <Alert variant="danger" className="m-3">
          {errorMessage}
          </Alert>}

        {/* Show spinner while loading ad data in edit mode */}
        {fetchingAd ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" className="me-2" />
            <span>Loading ad details...</span>
          </div>
        ) : (
          <Row className="g-0">
            {/* LEFT SIDE: Wizard Form Fields */}
            <Col lg={7} className="p-4">
              
              {/* EXACT MATCH WIZARD TRACKER STYLING AS REQUESTED */}
              <div className="d-flex align-items-center justify-content-center mb-4" style={{ gap: '24px' }}>
                {/* Step 1 */}
                <div className="d-flex flex-column align-items-center">
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: currentStep > 1 ? '#10b981' : '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '11px', fontWeight: '700'
                  }}>
                    {currentStep > 1 ? <BsCheck size={16} /> : '1'}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: currentStep >= 1 ? (currentStep > 1 ? '#10b981' : '#6366f1') : '#94a3b8', marginTop: '4px' }}>Media</span>
                </div>

                <div style={{ width: '80px', height: '2px', backgroundColor: currentStep > 1 ? '#10b981' : '#6366f1' }} />

                {/* Step 2 */}
                <div className="d-flex flex-column align-items-center">
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: currentStep > 2 ? '#10b981' : (currentStep === 2 ? '#6366f1' : '#e2e8f0'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: currentStep >= 2 ? '#fff' : '#64748b', fontSize: '11px', fontWeight: '700'
                  }}>
                    {currentStep > 2 ? <BsCheck size={16} /> : '2'}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: currentStep === 2 ? '#6366f1' : (currentStep > 2 ? '#10b981' : '#94a3b8'), marginTop: '4px' }}>Details</span>
                </div>

                <div style={{ width: '80px', height: '2px', backgroundColor: currentStep > 2 ? '#6366f1' : '#e2e8f0' }} />

                {/* Step 3 */}
                <div className="d-flex flex-column align-items-center">
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: currentStep === 3 ? '#6366f1' : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: currentStep === 3 ? '#fff' : '#64748b', fontSize: '11px', fontWeight: '700'
                  }}>
                    3
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: currentStep === 3 ? '700' : '600', color: currentStep === 3 ? '#6366f1' : '#94a3b8', marginTop: '4px' }}>Publish</span>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                  <div>
                    <Form.Group className="mb-3">
                      <Form.Label><BsTag className="me-2" />Ad Type</Form.Label>
                      <Form.Select name="type" value={formValues.type} onChange={handleChange} isInvalid={!!errors.type}>
                        <option value="">Select Ad Type</option>
                        <option value="image">Image</option>
                        <option value="audio">Audio</option>
                        <option value="video">Video</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.type}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label><BsUpload className="me-2" />Upload File</Form.Label>
                      <div className={`dropzone ${dragActive ? 'active' : ''}`} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                        <BsUpload size={24} className="text-primary mb-2" />
                        <div className="fw-semibold">Click to upload or drag &amp; drop file[cite: 3]</div>
                        <small className="text-muted">PNG, JPG, or WEBP up to 5MB[cite: 3]</small>
                        <Form.Control ref={fileInputRef} type="file" name="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="d-none" />
                      </div>
                      {formValues.file && <small className="text-muted mt-1 d-block">Selected: {formValues.file.name}</small>}
                    </Form.Group>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <Form.Group className="mb-3">
                      <Form.Label><BsPencilSquare className="me-2" />Title</Form.Label>
                      <Form.Control type="text" name="title" value={formValues.title} onChange={handleChange} isInvalid={!!errors.title} placeholder="Enter a catchy title for your ad[cite: 3]" />
                      <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label><BsCardText className="me-2" />Description</Form.Label>
                      <Form.Control as="textarea" rows={3} name="description" value={formValues.description} onChange={handleChange} isInvalid={!!errors.description} placeholder="Describe your advertisement[cite: 3]" />
                      <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                    </Form.Group>

                    <Row>
                      <Col md={7}>
                        <Form.Group className="mb-3">
                          <Form.Label><BsGeoAlt className="me-2" />Pincode</Form.Label>
                          <div className="input-group">
                            <Form.Control type="text" name="pincode" value={formValues.pincode} onChange={handleChange} isInvalid={!!errors.pincode} placeholder="Enter 6-digit pincode" />
                            <Button variant="outline-secondary" onClick={useMyLocation} disabled={locating} type="button">
                              {locating ? <Spinner size="sm" animation="border" /> : 'Use My Location'}
                            </Button>
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={5}>
                        <Form.Group className="mb-3">
                          <Form.Label><BsLayers className="me-2" />Display Level</Form.Label>
                          <Form.Select name="displaylevel" value={formValues.displaylevel} onChange={handleChange} isInvalid={!!errors.displaylevel}>
                            <option value="">Select Level</option>
                            <option value="1">City</option>
                            <option value="2">District</option>
                            <option value="3">State</option>
                            <option value="4">Country</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <h6 className="fw-bold mb-3">Final Review &amp; Launch Options[cite: 3]</h6>
                    <div className="p-3 mb-3 bg-light rounded border">
                      <p className="mb-1 text-success fw-bold">✓ Media &amp; Information Ready[cite: 3]</p>
                      <p className="mb-1"><strong>Title:</strong> {formValues.title || 'Untitled'}</p>
                      <p className="mb-0"><strong>Target Pincode:</strong> {formValues.pincode || 'Not set'}</p>
                    </div>
                  </div>
                )}

                {/* Wizard Controls Footer */}
                <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                  {currentStep > 1 ? (
                    <Button variant="secondary" onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => props.setShowNewAdModal(false)}>Cancel</Button>
                  )}

                  {currentStep < 3 ? (
                    <Button className="gradient-btn" onClick={() => setCurrentStep(currentStep + 1)}>Next Step →</Button>
                  ) : (
                    <Button className="gradient-btn" onClick={handleSubmit} disabled={loading}>
                      {loading ? <Spinner size="sm" animation="border" /> : '🚀 Publish Ad'}[cite: 3]
                    </Button>
                  )}
                </div>
              </Form>
            </Col>

            {/* RIGHT SIDE: Split-Screen Live Preview Layout */}
            <Col lg={5} className="preview-pane p-4 d-flex flex-column align-items-center justify-content-center">
              <span className="text-muted fw-bold small mb-3" style={{ letterSpacing: '1.5px' }}>LIVE AD PREVIEW[cite: 3]</span>
              
              <div className="card shadow-sm border-0 p-3 w-100" style={{ maxWidth: '300px', borderRadius: '16px' }}>
                <div className="bg-light rounded d-flex align-items-center justify-content-center mb-3" style={{ height: '160px', overflow: 'hidden' }}>
                  {imagePreviewUrl ? (
                    <img src={imagePreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="text-muted small">Image Preview Appears Here[cite: 3]</span>
                  )}
                </div>
                <h6 className="fw-bold text-dark text-truncate">{formValues.title || 'Your Catchy Title'}[cite: 3]</h6>
                <p className="text-muted small" style={{ fontSize: '11px', minHeight: '30px' }}>
                  {formValues.description || 'Ad description text will populate here as you type to give you a live preview.'}[cite: 3]
                </p>
                <div className="d-flex gap-2 mt-2">
                  <span className="badge bg-light text-primary border">📍 {formValues.pincode || 'No Pincode'}[cite: 3]</span>
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default NewAdModal;