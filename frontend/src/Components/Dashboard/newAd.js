import React, { useState, useEffect } from 'react';
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
import { BsUpload, BsCheck2Circle, BsImage } from 'react-icons/bs';

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
            console.log("Fetched ad data for editing:", ad);
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
    event.preventDefault();
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
      console.error(isEditMode ? "Error updating ad:" : "Error creating ad:", error);
      
      if (error.response) {
        const { status, data } = error.response;
        if (status === 422) {
          console.error("Validation error details (422):", data);
          setErrorMessage(data.error || data.message || 'Validation failed. Please check your inputs.');
        } else if (status === 401) {
          setErrorMessage('Authentication failed. Please login again.');
        } else {
          setErrorMessage(data.error || data.message || (isEditMode ? 'Failed to update ad. Please try again.' : 'Failed to create ad. Please try again.'));
        }
      } else if (error.request) {
        setErrorMessage('Network error. Please check your connection.');
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
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
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit Advertisement' : 'Create New Advertisement'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {success && (
          <Alert variant="success" className="d-flex align-items-center">
            <BsCheck2Circle className="me-2" /> Advertisement {isEditMode ? 'updated' : 'created'} successfully!
          </Alert>
        )}
        
        {errorMessage && (
          <Alert variant="danger">
            {errorMessage}
          </Alert>
        )}

        {/* Show spinner while loading ad data in edit mode */}
        {fetchingAd ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" className="me-2" />
            <span>Loading ad details...</span>
          </div>
        ) : (
        
        <Form onSubmit={handleSubmit}>
          <Container>

            {/* Current Ad Image Preview (edit mode) */}
            {imagePreviewUrl && (
              <Row className="mb-3">
                <Col md={12}>
                  <Form.Label className="d-flex align-items-center">
                    <BsImage className="me-2" />
                    {formValues.file ? 'New Image Preview' : 'Current Ad Image'}
                  </Form.Label>
                  <div 
                    style={{ 
                      border: '2px dashed #dee2e6', 
                      borderRadius: 8, 
                      padding: 8, 
                      textAlign: 'center',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <img 
                      src={imagePreviewUrl} 
                      alt="Ad preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: 200, 
                        objectFit: 'contain',
                        borderRadius: 4 
                      }} 
                    />
                  </div>
                  {isEditMode && !formValues.file && (
                    <small className="text-muted">
                      This is the current image. Upload a new file below to replace it.
                    </small>
                  )}
                </Col>
              </Row>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ad Type</Form.Label>
                  <Form.Select 
                    name="type" 
                    value={formValues.type} 
                    onChange={handleChange}
                    isInvalid={!!errors.type}
                  >
                    <option value="">Select Ad Type</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.type}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {isEditMode ? 'Replace Image (optional)' : 'Upload File'}
                  </Form.Label>
                  <div className="input-group">
                    <Form.Control 
                      type="file" 
                      name="file" 
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleChange}
                      isInvalid={!!errors.file}
                      className="form-control"
                    />
                    <span className="input-group-text">
                      <BsUpload />
                    </span>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.file}
                  </Form.Control.Feedback>
                  {formValues.file && (
                    <small className="text-muted">
                      Selected: {formValues.file.name}
                    </small>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formValues.title}
                    onChange={handleChange}
                    isInvalid={!!errors.title}
                    placeholder="Enter a catchy title for your ad"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.title}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formValues.description}
                    onChange={handleChange}
                    isInvalid={!!errors.description}
                    placeholder="Describe your advertisement"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pincode</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      name="pincode"
                      value={formValues.pincode}
                      onChange={handleChange}
                      isInvalid={!!errors.pincode}
                      placeholder="Enter 6-digit pincode"
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={useMyLocation}
                      disabled={locating}
                      type="button"
                    >
                      {locating ? (
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      ) : (
                        'Use My Location'
                      )}
                    </Button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.pincode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Display Level</Form.Label>
                  <Form.Select
                    name="displaylevel"
                    value={formValues.displaylevel}
                    onChange={handleChange}
                    isInvalid={!!errors.displaylevel}
                  >
                    <option value="">Select Display Level</option>
                    <option value="1">City</option>
                    <option value="2">District</option>
                    <option value="3">State</option>
                    <option value="4">Country</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.displaylevel}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Container>
        </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => props.setShowNewAdModal(false)}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          disabled={loading || success || fetchingAd}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Processing...
            </>
          ) : success ? (
            <>
              <BsCheck2Circle className="me-2" />
              {isEditMode ? 'Updated' : 'Created'}
            </>
          ) : (
            isEditMode ? 'Update Advertisement' : 'Create Advertisement'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NewAdModal;