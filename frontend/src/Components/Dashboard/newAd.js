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
import { BsUpload, BsCheck2Circle } from 'react-icons/bs';

function NewAdModal(props) {

  const initialFormState = {
    file: null,
    userid: '',
    title: '',
    description: '',
    pincode: '',
    displaylevel: '',
    type: ''
  }

  const [formValues, setFormValues] = useState(initialFormState);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (props.selectedAd > 0) {
      async function getAdById() {
        const token = localStorage.getItem("token");
        const response = await api.get(`http://localhost:5000/ad/ad/${props.selectedAd}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        console.log(response.data);
      }
      getAdById();
    }
  }, [props.selectedAd]);

  const validateForm = () => {
    const newErrors = {};
    if (!formValues.type) newErrors.type = 'Please select an ad type.';
    if (!formValues.file) newErrors.file = 'Please upload a file.';
    if (!formValues.title) newErrors.title = 'Title is required.';
    if (!formValues.description) newErrors.description = 'Description is required.';
    if (!/^[1-9][0-9]{5}$/.test(formValues.pincode)) newErrors.pincode = 'Enter a valid 6-digit pincode.';
    if (!formValues.displaylevel) newErrors.displaylevel = 'Please select a display level.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const getFileLabel = () => {
    if (formValues.file) {
      return formValues.file.name;
    }
    return 'Choose file';
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    
    // Clear error for this field when user makes a change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be less than 5MB');
      return;
    }
    
    // Store file in state
    setFormValues(prev => ({
      ...prev,
      file: file
    }));
  }
};

const createAd = async (event) => {
  event.preventDefault();
  setSuccess(false);
  setErrorMessage('');
  
  // Validate form
  if (!validateForm()) return;
  
  // Validate file
  if (!formValues.file) {
    setErrorMessage('Please select an image file');
    return;
  }
  
  // File type and size validation
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
  
  setLoading(true);
  const token = localStorage.getItem("token");
  formValues.userid = localStorage.getItem("userid");

  const formData = new FormData();
  
  // Append all form values (file will be included) 
  Object.entries(formValues).forEach(([key, value]) => {
    if(key !== 'file')
    formData.append(key, value);
  });
  
const fileInput = document.querySelector('input[type="file"]');
  if (fileInput && fileInput.files[0]) {
    formData.append('file', fileInput.files[0]);
  } else if (formValues.file instanceof File) {
    formData.append('file', formValues.file);
  } else {
    setErrorMessage('Invalid file format');
    setLoading(false);
    return;
  }
  
  // Log FormData contents for debugging
  console.log("FormData contents:");
  for (let pair of formData.entries()) {
    if (pair[0] === 'file') {
      console.log(`${pair[0]}:`, {
        name: pair[1].name,
        size: pair[1].size,
        type: pair[1].type
      });
    } else {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
  }

  try {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const response = await api.post(`${API_URL}/ad/create`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        authorization: `Bearer ${token}`,
      },
    });
    
    // Handle success response
    const { success, message, url, adId } = response.data;
    if (success) {
      setSuccess(true);
      // setSuccessMessage(message);
      // setCreatedAd({ id: adId, url }); // Store for potential use
      
      setTimeout(() => {
        props.setShowNewAdModal(false);
        // Optionally reset form
        setFormValues(initialFormState);
      }, 1500);
    }
  } catch (error) {
    console.error("Error creating ad:", error);
    
    // Enhanced error handling
    if (error.response) {
      const { status, data } = error.response;
      if (status === 422) {
        setErrorMessage(data.error || 'Validation failed. Please check your inputs.');
      } else if (status === 401) {
        setErrorMessage('Authentication failed. Please login again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else {
        setErrorMessage(data.error || data.message || 'Failed to create ad. Please try again.');
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

  return (
    <Modal 
      show={props.showNewAdModal} 
      onHide={() => props.setShowNewAdModal(false)}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>{props.selectedAd > 0 ? 'Edit Advertisement' : 'Create New Advertisement'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {success && (
          <Alert variant="success" className="d-flex align-items-center">
            <BsCheck2Circle className="me-2" /> Advertisement created successfully!
          </Alert>
        )}
        
        {errorMessage && (
          <Alert variant="danger">
            {errorMessage}
          </Alert>
        )}
        
        <Form onSubmit={createAd}>
          <Container>
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
                  <Form.Label>Upload File</Form.Label>
                  <div className="input-group">
                    <Form.Control 
                      type="file" 
                      name="file" 
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Selected file:", {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Only JPEG, PNG, and WebP images are allowed');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size must be less than 5MB');
        return;
      }
      
      // Update form state
      setFormValues(prev => ({
        ...prev,
        file: file
      }));
    }
  }}
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
                  <Form.Control
                    type="text"
                    name="pincode"
                    value={formValues.pincode}
                    onChange={handleChange}
                    isInvalid={!!errors.pincode}
                    placeholder="Enter 6-digit pincode"
                  />
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => props.setShowNewAdModal(false)}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={createAd} 
          disabled={loading || success}
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
              <BsCheck2Circle className="me-2" /> Created
            </>
          ) : (
            'Create Advertisement'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NewAdModal;
