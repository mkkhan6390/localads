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

// Placement Requirements Table — explicit image specifications enforced
// per ad placement so user-uploaded creatives fit their slot without
// distortion.
const PLACEMENT_SPECS = {
  bottom_banner: {
    label: 'Bottom Banner',
    aspectRatios: [4 / 1, 8 / 1],
    aspectRatioLabels: ['4:1', '8:1'],
    minWidth: 728,
    minHeight: 90,
    recommendedWidth: 1200,
    recommendedHeight: 300,
    useCase: 'Fixed or sticky footers',
  },
  right_sidebar: {
    label: 'Right Sidebar',
    aspectRatios: [1 / 2, 9 / 16],
    aspectRatioLabels: ['1:2', '9:16'],
    minWidth: 300,
    minHeight: 600,
    recommendedWidth: 600,
    recommendedHeight: 1200,
    useCase: 'Vertical sidebars',
  },
  interstitial: {
    label: 'Interstitial (Full Screen)',
    aspectRatios: [16 / 9, 4 / 3],
    aspectRatioLabels: ['16:9', '4:3'],
    minWidth: 1200,
    minHeight: 800,
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    useCase: 'Center overlay modal',
  },
};

// Client-side file validation limits shared across all placements.
const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// Reads an image file's pixel dimensions using the HTML5 Image() constructor
// and checks them against the selected placement's minimum resolution and
// allowed aspect ratio(s) (with a small tolerance), rather than a generic
// min/max range.
function checkImageSpecs(file, placementKey) {
  const spec = PLACEMENT_SPECS[placementKey];

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const { width, height } = img;
      URL.revokeObjectURL(url);

      if (!spec) {
        resolve({ valid: false, width, height, reason: 'no_placement' });
        return;
      }

      let reason = null;
      if (width < spec.minWidth || height < spec.minHeight) {
        reason = 'too_small';
      } else {
        const ratio = width / height;
        const matchesRatio = spec.aspectRatios.some(
          (r) => Math.abs(ratio - r) / r < 0.05 // 5% tolerance
        );
        if (!matchesRatio) reason = 'bad_ratio';
      }

      resolve({ valid: !reason, width, height, reason });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, width: 0, height: 0, reason: 'unreadable' });
    };
    img.src = url;
  });
}

// Grace period (seconds) after confirming publish, during which the user
// can hit Emergency Stop to abort before the ad actually goes out.
const PUBLISH_GRACE_PERIOD_SECONDS = 15;

function NewAdModal(props) {

  const initialFormState = {
    file: null,
    userid: '',
    title: '',
    description: '',
    pincode: '',
    displaylevel: '',
    type: '',
    placement: ''
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
  const [showConfirmModal, setShowConfirmModal] = useState(false); // Final "ready to publish" confirmation
  const [pendingPublish, setPendingPublish] = useState(false); // true during the emergency-stop grace window
  const [graceSecondsLeft, setGraceSecondsLeft] = useState(0);
  const [imageSpecCheck, setImageSpecCheck] = useState(null); // result of checking the current file against the selected Placement's spec, shown live in the preview pane
  const fileInputRef = useRef(null);
  const publishTimeoutRef = useRef(null);
  const graceIntervalRef = useRef(null);

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
      setShowConfirmModal(false);
      clearTimeout(publishTimeoutRef.current);
      clearInterval(graceIntervalRef.current);
      setPendingPublish(false);
      setGraceSecondsLeft(0);
      setImageSpecCheck(null);

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
              type: ad.type || '',
              placement: ad.placement || ''
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
    if (!formValues.placement) newErrors.placement = 'Please select a placement.';
    // File is required only for new ads, not when editing (existing image stays)
    if (!formValues.file && !isEditMode) newErrors.file = 'Please upload a file.';
    if (!formValues.title) newErrors.title = 'Title is required.';
    if (!formValues.description) newErrors.description = 'Description is required.';
    if (!/^[1-9][0-9]{5}$/.test(formValues.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode.';
    if (!formValues.displaylevel) newErrors.displaylevel = 'Please select a display level.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validates only the fields relevant to a given wizard step, so we can
  // block "Next Step" until that step's required details are complete.
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formValues.type) newErrors.type = 'Please select an ad type.';
      if (!formValues.placement) newErrors.placement = 'Please select a placement.';
      if (!formValues.file && !isEditMode) newErrors.file = 'Please upload a file.';
    } else if (step === 2) {
      if (!formValues.title) newErrors.title = 'Title is required.';
      if (!formValues.description) newErrors.description = 'Description is required.';
      if (!/^[1-9][0-9]{5}$/.test(formValues.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode.';
      if (!formValues.displaylevel) newErrors.displaylevel = 'Please select a display level.';
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // "Next Step" is blocked (with an alert) until the current step's
  // required details are filled in completely.
  const handleNextStep = () => {
    setErrorMessage('');
    if (!validateStep(currentStep)) {
      setErrorMessage('Please fill in all required details before continuing.');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  // Details Verification & Completeness Check: run before showing the
  // final "ready to publish" confirmation. Blocks progression (with an
  // alert) if any mandatory field is missing.
  const handlePublishClick = () => {
    setErrorMessage('');
    if (!validateForm()) {
      setErrorMessage('Please fill in all required details before continuing.');
      return;
    }
    setShowConfirmModal(true);
  };

  // Confirmation modal "Yes": start the emergency-stop grace window instead
  // of publishing immediately, so the user has a last chance to abort.
  const handleConfirmPublish = () => {
    setShowConfirmModal(false);
    setPendingPublish(true);
    setGraceSecondsLeft(PUBLISH_GRACE_PERIOD_SECONDS);

    graceIntervalRef.current = setInterval(() => {
      setGraceSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    publishTimeoutRef.current = setTimeout(() => {
      clearInterval(graceIntervalRef.current);
      setPendingPublish(false);
      handleSubmit();
    }, PUBLISH_GRACE_PERIOD_SECONDS * 1000);
  };

  // Confirmation modal "No": send the user back to Step 1 to make changes.
  const handleCancelPublish = () => {
    setShowConfirmModal(false);
    setCurrentStep(1);
  };

  // 🚨 Emergency Stop: abort the pending publish before it goes out, and
  // return the user to Step 1 with all form data preserved.
  const handleEmergencyStop = () => {
    clearTimeout(publishTimeoutRef.current);
    clearInterval(graceIntervalRef.current);
    setPendingPublish(false);
    setGraceSecondsLeft(0);
    setCurrentStep(1);
  };

  // Rejects a file that doesn't fit the given placement's requirements:
  // clears the file input so the same file can be re-selected after the
  // user fixes it, and clears the file from form state / preview so a
  // mismatched image never gets accepted.
  const rejectFile = (inputEl) => {
    if (inputEl) inputEl.value = '';
    setFormValues((prev) => ({ ...prev, file: null }));
    setImageSpecCheck(null);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const inputEl = e.target;

    if (name === 'file' && files && files[0]) {
      const selectedFile = files[0];

      // Validate type/size/aspect-ratio against the selected Placement's
      // spec BEFORE accepting the file. Any mismatch is alerted and the
      // file is rejected outright — it never reaches form state or the
      // Live Ad Preview.
      if (!formValues.placement) {
        window.alert('Please select a Placement first so we can validate this image against the correct specifications.');
        rejectFile(inputEl);
        return;
      }
      if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(selectedFile.type)) {
        window.alert('This file type is not supported. Please upload a PNG, JPG, or WEBP image.');
        rejectFile(inputEl);
        return;
      }
      if (selectedFile.size > FILE_CONSTRAINTS.MAX_FILE_SIZE_MB * 1024 * 1024) {
        window.alert(`File size must be less than ${FILE_CONSTRAINTS.MAX_FILE_SIZE_MB}MB.`);
        rejectFile(inputEl);
        return;
      }

      const spec = PLACEMENT_SPECS[formValues.placement];
      checkImageSpecs(selectedFile, formValues.placement).then((specCheck) => {
        if (!specCheck.valid) {
          if (specCheck.reason === 'too_small') {
            window.alert(
              `This image doesn't match the "${spec.label}" placement's size requirements. ` +
              `Minimum size is ${spec.minWidth}×${spec.minHeight}px, but your image is ${specCheck.width}×${specCheck.height}px.`
            );
          } else if (specCheck.reason === 'bad_ratio') {
            window.alert(
              `This image's aspect ratio doesn't match the "${spec.label}" placement. ` +
              `Required aspect ratio: ${spec.aspectRatioLabels.join(' or ')}. ` +
              `Recommended size: ${spec.recommendedWidth}×${spec.recommendedHeight}px. ` +
              `Your image is ${specCheck.width}×${specCheck.height}px.`
            );
          } else {
            window.alert("Couldn't read this image file. Please choose a different file.");
          }
          // Reject: do not accept the file, do not update the preview.
          rejectFile(inputEl);
          return;
        }

        // Accepted: only now does the file enter form state and the
        // Live Ad Preview, sized/shaped for the selected placement.
        setFormValues((prev) => ({ ...prev, file: selectedFile }));
        setExistingImageUrl('');
        setImageSpecCheck({ ...specCheck, placement: formValues.placement });
      });
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      // If the Placement changes after a file was already accepted,
      // re-validate that same file against the newly selected placement's
      // spec — and reject it (with an alert) if it no longer fits.
      if (name === 'placement' && formValues.file) {
        const fileToRecheck = formValues.file;
        const newSpec = PLACEMENT_SPECS[value];
        checkImageSpecs(fileToRecheck, value).then((specCheck) => {
          if (!specCheck.valid && newSpec) {
            if (specCheck.reason === 'too_small') {
              window.alert(
                `Your selected image no longer fits "${newSpec.label}". Minimum size is ` +
                `${newSpec.minWidth}×${newSpec.minHeight}px, but your image is ${specCheck.width}×${specCheck.height}px. Please upload a new image.`
              );
            } else if (specCheck.reason === 'bad_ratio') {
              window.alert(
                `Your selected image doesn't match "${newSpec.label}"'s required aspect ratio ` +
                `(${newSpec.aspectRatioLabels.join(' or ')}). Please upload a new image.`
              );
            } else {
              window.alert("Couldn't read this image file. Please choose a different file.");
            }
            rejectFile(fileInputRef.current);
          } else {
            setImageSpecCheck({ ...specCheck, placement: value });
          }
        });
      }
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
      const placementSpec = PLACEMENT_SPECS[formValues.placement];

      if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(formValues.file.type)) {
        setErrorMessage('Only JPEG, PNG, and WebP images are allowed');
        return;
      }

      if (formValues.file.size > FILE_CONSTRAINTS.MAX_FILE_SIZE_MB * 1024 * 1024) {
        setErrorMessage(`File size must be less than ${FILE_CONSTRAINTS.MAX_FILE_SIZE_MB}MB`);
        return;
      }

      if (!placementSpec) {
        setErrorMessage('Please select a valid Placement for this ad.');
        return;
      }

      // Enforce the exact aspect ratio and minimum resolution required by
      // the selected placement (Bottom Banner / Right Sidebar / Interstitial).
      const specCheck = await checkImageSpecs(formValues.file, formValues.placement);
      if (!specCheck.valid) {
        if (specCheck.reason === 'too_small') {
          setErrorMessage(
            `Image is too small for "${placementSpec.label}". Minimum size is ` +
            `${placementSpec.minWidth}×${placementSpec.minHeight}px. Your image is ${specCheck.width}×${specCheck.height}px.`
          );
        } else if (specCheck.reason === 'bad_ratio') {
          setErrorMessage(
            `Image aspect ratio doesn't match "${placementSpec.label}" (requires ` +
            `${placementSpec.aspectRatioLabels.join(' or ')}). Your image is ${specCheck.width}×${specCheck.height}px.`
          );
        } else {
          setErrorMessage('Could not read this image file. Please choose a different file.');
        }
        return;
      }
    }
    
    setLoading(true);
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userid");

    const formData = new FormData();
    
    formData.append('type', formValues.type);
    formData.append('placement', formValues.placement);
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

  // The Placement Requirements Table spec for the currently selected
  // placement — drives the dynamic aspect-ratio guidance shown in Step 1.
  const selectedPlacementSpec = PLACEMENT_SPECS[formValues.placement];

  // Shapes the Live Ad Preview box to match the selected placement's
  // required aspect ratio (e.g. short & wide for Bottom Banner, tall &
  // narrow for Right Sidebar, large for Interstitial), instead of a fixed
  // square-ish box for every type.
  const PREVIEW_CARD_WIDTH = 260; // px, matches the preview card's inner width
  const getPreviewBoxStyle = (spec) => {
    if (!spec) return { width: '100%', height: '160px' };
    const ratio = spec.recommendedWidth / spec.recommendedHeight;
    const rawHeight = PREVIEW_CARD_WIDTH / ratio;
    const height = Math.round(Math.max(70, Math.min(rawHeight, 320)));
    return { width: '100%', height: `${height}px` };
  };

  return (
    <>
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
        .ad-container img {
          width: 100%;
          height: 100%;
          object-fit: cover; /* Prevents stretching */
          object-position: center;
        }
      `}</style>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit Advertisement' : 'Create New Advertisement'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {pendingPublish && (
          <Alert variant="warning" className="m-3 d-flex align-items-center justify-content-between">
            <span> Publishing in {graceSecondsLeft}s — you can still stop this.</span>
            <Button variant="danger" size="sm" onClick={handleEmergencyStop}>Emergency Stop</Button>
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="m-3 d-flex align-items-center">
            <BsCheck2Circle className="me-2" /> Advertisement {isEditMode ? 'updated' : 'created'} successfully!
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
                      <Form.Label><BsLayers className="me-2" />Placement</Form.Label>
                      <Form.Select name="placement" value={formValues.placement} onChange={handleChange} isInvalid={!!errors.placement}>
                        <option value="">Select Placement</option>
                        {Object.entries(PLACEMENT_SPECS).map(([key, spec]) => (
                          <option key={key} value={key}>{spec.label}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.placement}</Form.Control.Feedback>
                      {selectedPlacementSpec && (
                        <small className="text-muted d-block mt-1">
                          Aspect ratio: {selectedPlacementSpec.aspectRatioLabels.join(' or ')} · Min {selectedPlacementSpec.minWidth}×{selectedPlacementSpec.minHeight}px · Recommended {selectedPlacementSpec.recommendedWidth}×{selectedPlacementSpec.recommendedHeight}px · Best for {selectedPlacementSpec.useCase}
                        </small>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label><BsUpload className="me-2" />Upload File</Form.Label>
                      <div className={`dropzone ${dragActive ? 'active' : ''}`} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                        <BsUpload size={24} className="text-primary mb-2" />
                        <div className="fw-semibold">Click to upload or drag &amp; drop file</div>
                        <small className="text-muted">
                          {selectedPlacementSpec
                            ? `PNG, JPG, or WEBP, up to ${FILE_CONSTRAINTS.MAX_FILE_SIZE_MB}MB. Requires ${selectedPlacementSpec.aspectRatioLabels.join(' or ')} ratio, min ${selectedPlacementSpec.minWidth}×${selectedPlacementSpec.minHeight}px (recommended ${selectedPlacementSpec.recommendedWidth}×${selectedPlacementSpec.recommendedHeight}px).`
                            : 'Select a Placement above to see the required image specifications.'}
                        </small>
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
                      <Form.Control type="text" name="title" value={formValues.title} onChange={handleChange} isInvalid={!!errors.title} placeholder="Enter a catchy title for your ad" />
                      <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label><BsCardText className="me-2" />Description</Form.Label>
                      <Form.Control as="textarea" rows={3} name="description" value={formValues.description} onChange={handleChange} isInvalid={!!errors.description} placeholder="Describe your advertisement" />
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
                    <h6 className="fw-bold mb-3">Final Review &amp; Launch Options</h6>
                    <div className="p-3 mb-3 bg-light rounded border">
                      <p className="mb-1 text-success fw-bold">✓ Media &amp; Information Ready</p>
                      <p className="mb-1"><strong>Title:</strong> {formValues.title || 'Untitled'}</p>
                      <p className="mb-1"><strong>Placement:</strong> {selectedPlacementSpec ? selectedPlacementSpec.label : 'Not set'}</p>
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
                    <Button className="gradient-btn" onClick={handleNextStep}>Next Step →</Button>
                  ) : (
                    <Button className="gradient-btn" onClick={handlePublishClick} disabled={loading}>
                      {loading ? <Spinner size="sm" animation="border" /> : '🚀 Publish Ad'}
                    </Button>
                  )}
                </div>
              </Form>
            </Col>

            {/* RIGHT SIDE: Split-Screen Live Preview Layout */}
            <Col lg={5} className="preview-pane p-4 d-flex flex-column align-items-center justify-content-center">
              <span className="text-muted fw-bold small mb-3" style={{ letterSpacing: '1.5px' }}>LIVE AD PREVIEW</span>
              
              <div className="card shadow-sm border-0 p-3 w-100" style={{ maxWidth: '300px', borderRadius: '16px' }}>
                <div
                  className="ad-container bg-light rounded d-flex align-items-center justify-content-center mb-2"
                  style={{
                    ...getPreviewBoxStyle(selectedPlacementSpec),
                    overflow: 'hidden',
                    border: imageSpecCheck ? `2px solid ${imageSpecCheck.valid ? '#10b981' : '#ef4444'}` : '2px solid transparent'
                  }}
                >
                  {imagePreviewUrl ? (
                    <img src={imagePreviewUrl} alt="Preview" />
                  ) : (
                    <span className="text-muted small">
                      {selectedPlacementSpec
                        ? `${selectedPlacementSpec.label} preview (${selectedPlacementSpec.aspectRatioLabels.join(' or ')})`
                        : 'Image Preview Appears Here'}
                    </span>
                  )}
                </div>

                {/* Live match/mismatch indicator: re-evaluated on every new file
                    and every Placement change, so it always reflects the file
                    + placement combination currently shown above. */}
                {imageSpecCheck && (
                  imageSpecCheck.valid ? (
                    <Alert variant="success" className="py-1 px-2 mb-2 small d-flex align-items-center">
                      <BsCheck2Circle className="me-1" /> Matches {PLACEMENT_SPECS[imageSpecCheck.placement]?.label} spec ({imageSpecCheck.width}×{imageSpecCheck.height}px)
                    </Alert>
                  ) : (
                    <Alert variant="danger" className="py-1 px-2 mb-2 small">
                      {imageSpecCheck.reason === 'no_placement' && '⚠ Select a Placement to validate this image.'}
                      {imageSpecCheck.reason === 'bad_type' && '⚠ Unsupported file type. Use JPG, PNG, or WEBP.'}
                      {imageSpecCheck.reason === 'too_big_file' && `⚠ File exceeds ${FILE_CONSTRAINTS.MAX_FILE_SIZE_MB}MB.`}
                      {imageSpecCheck.reason === 'unreadable' && '⚠ Could not read this image file.'}
                      {imageSpecCheck.reason === 'too_small' && PLACEMENT_SPECS[imageSpecCheck.placement] &&
                        `⚠ Too small for ${PLACEMENT_SPECS[imageSpecCheck.placement].label} (min ${PLACEMENT_SPECS[imageSpecCheck.placement].minWidth}×${PLACEMENT_SPECS[imageSpecCheck.placement].minHeight}px). Yours: ${imageSpecCheck.width}×${imageSpecCheck.height}px.`}
                      {imageSpecCheck.reason === 'bad_ratio' && PLACEMENT_SPECS[imageSpecCheck.placement] &&
                        `⚠ Wrong ratio for ${PLACEMENT_SPECS[imageSpecCheck.placement].label} (needs ${PLACEMENT_SPECS[imageSpecCheck.placement].aspectRatioLabels.join(' or ')}). Yours: ${imageSpecCheck.width}×${imageSpecCheck.height}px.`}
                    </Alert>
                  )
                )}

                <span
                  className="badge mb-2 align-self-start"
                  style={{ backgroundColor: selectedPlacementSpec ? '#6366f1' : '#e2e8f0', color: selectedPlacementSpec ? '#fff' : '#64748b', fontWeight: '600', letterSpacing: '0.3px' }}
                >
                  {selectedPlacementSpec ? selectedPlacementSpec.label : 'Placement Not Selected'}
                </span>
                <h6 className="fw-bold text-dark text-truncate">{formValues.title || 'Your Catchy Title'}</h6>
                <p className="text-muted small" style={{ fontSize: '11px', minHeight: '30px' }}>
                  {formValues.description || 'Ad description text will populate here as you type to give you a live preview.'}
                </p>
              </div>
            </Col>
          </Row>
        )}
      </Modal.Body>
    </Modal>

    {/* Ready to Publish & Final Confirmation modal */}
    <Modal show={showConfirmModal} onHide={handleCancelPublish} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Publish</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to publish this ad? Do you want to make any changes before publishing?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancelPublish}>No, make changes</Button>
        <Button className="gradient-btn" onClick={handleConfirmPublish} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Yes, publish'}
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
}

export default NewAdModal;