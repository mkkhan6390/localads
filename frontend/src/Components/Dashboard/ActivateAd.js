import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Modal, Form, OverlayTrigger, Tooltip, Tab, Nav, Row, Col, ToggleButton, ToggleButtonGroup, Spinner, Alert, Container, Card, InputGroup } from 'react-bootstrap';
import { BsArrowUpRightSquareFill, BsGlobe, BsWhatsapp, BsTelephone } from 'react-icons/bs';

function ActivateAdModal(props) {
    const [data, setData] = useState({});
    const [landingPageType, setLandingPageType] = useState('existing');
    const [platform, setPlatform] = useState('profilelink');
    const [landingurl, setLandingurl] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLandingurlChange = (event) => {

        if(platform === 'profilelink'){
            setLandingurl(event.target.value)
        }

        if(platform === 'whatsapp'){
            setLandingurl('https://wa.me/+91'+event.target.value)
            setPhone(event.target.value)
        }

        if(platform === 'phone'){
            setPhone(event.target.value)
            setLandingurl('tel:+91'+event.target.value)
        }

    }

    const handlePlatformChange = (event) => {
        setPlatform(event.target.value)
    }

    const handleCreateLandingPageRadio = (value) => {
        setLandingPageType(value)
    }

    const handleChange = (event) => {
        const { name, value } = event.target;
        setData((prev) => ({ ...prev, [name]: value }));
    };


    const activateAd = async () => {
        if (!landingurl) {
            setError('Please enter a valid landing page URL');
            return;
        }
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        const token = localStorage.getItem("token");

        try {
            const response = await axios.get(`http://localhost:5000/ad/activate?id=${props.selectedAd}&landingurl=${landingurl}`, {
                headers: { authorization: `Bearer ${token}` }
            });

            console.log(response.data.message);
            setSuccess(response.data.message);
            setTimeout(() => {
                props.setShowActivateAdModal(false);
            }, 1500);
        } catch (error) {
            console.error("Error activating ad:", error);
            setError(error.response?.data?.message || "Failed to activate ad.");
        } finally {
            setLoading(false);
        }
    }


    return (<>
        <Modal centered size="lg" show={props.showActivateAdModal} onHide={() => { props.setShowActivateAdModal(false) }}>
            <Modal.Header closeButton={true}>
                <Modal.Title className="fs-5">Activate Your Ad</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
                {success && <Alert variant="success" className="mb-4">{success}</Alert>}
                
                <Form>
                    <Card className="mb-4 border-0 shadow-sm">
                        <Card.Body>
                            <Card.Title className="mb-3 text-center">Where should we direct your customers?</Card.Title>
                            <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
                                <ToggleButtonGroup type="radio" name="landingpagetype" value={landingPageType} onChange={handleCreateLandingPageRadio}>
                                    <ToggleButton id="tbg-radio-1" value={'existing'} variant="outline-primary">
                                        <BsGlobe className="me-2" /> Existing Website
                                    </ToggleButton>
                                    <ToggleButton id="tbg-radio-2" value={'social'} variant="outline-primary">
                                        <BsWhatsapp className="me-2" /> Social/Contact
                                    </ToggleButton>
                                    <ToggleButton id="tbg-radio-3" value={'create'} variant="outline-primary">
                                        <a href='https://landing-page-creator.com' target="_blank" className="text-decoration-none d-flex align-items-center">
                                            Create Landing Page <BsArrowUpRightSquareFill className="ms-2" />
                                        </a>
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </div>

                    {landingPageType === 'existing' && (
                        <Form.Group controlId="landing_url" className="mb-3">
                            <Form.Label>Website URL</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="landing_url" 
                                value={landingurl} 
                                onChange={handleLandingurlChange} 
                                placeholder="https://your-website.com" 
                                className="shadow-sm"
                            />
                            <Form.Text className="text-muted">
                                Enter the full URL including https://
                            </Form.Text>
                        </Form.Group>
                    )}

                    {landingPageType === 'social' && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Contact Type</Form.Label>
                                <Form.Select 
                                    name="type" 
                                    value={platform} 
                                    onChange={handlePlatformChange}
                                    className="shadow-sm"
                                >
                                    <option value='profilelink'>Social Media Profile</option>
                                    <option value='whatsapp'>WhatsApp Contact</option>
                                    <option value='phone'>Phone Number</option>
                                </Form.Select>
                            </Form.Group>

                            {platform === 'profilelink' && (
                                <Form.Group controlId="profilelink" className="mb-3">
                                    <Form.Label>Profile URL</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="profilelink" 
                                        value={landingurl} 
                                        onChange={handleLandingurlChange} 
                                        placeholder="https://instagram.com/your-profile" 
                                        className="shadow-sm"
                                    />
                                    <Form.Text className="text-muted">
                                        Enter your social media profile URL
                                    </Form.Text>
                                </Form.Group>
                            )}
                            
                            {['whatsapp', 'phone'].includes(platform) && (
                                <Form.Group controlId="phone" className="mb-3">
                                    <Form.Label>{platform === 'whatsapp' ? 'WhatsApp Number' : 'Phone Number'}</Form.Label>
                                    <InputGroup className="mb-3">
                                        <InputGroup.Text>+91</InputGroup.Text>
                                        <Form.Control 
                                            type="text" 
                                            name="phone" 
                                            value={phone} 
                                            onChange={handleLandingurlChange} 
                                            placeholder={platform === 'whatsapp' ? "9876543210" : "9876543210"}
                                            className="shadow-sm" 
                                        />
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        {platform === 'whatsapp' ? 'WhatsApp number without country code' : 'Phone number without country code'}
                                    </Form.Text>
                                </Form.Group>
                            )}
                        </>
                    )}
 

                     {landingPageType === 'create' && (
                        <div className="text-center p-4">
                            <p className="mb-4">You'll be redirected to our landing page creator tool where you can design a custom page for your ad.</p>
                            <Button 
                                variant="outline-primary" 
                                href="https://landing-page-creator.com" 
                                target="_blank"
                                className="d-inline-flex align-items-center"
                            >
                                Open Landing Page Creator <BsArrowUpRightSquareFill className="ms-2" />
                            </Button>
                        </div>
                    )}
                    </Card.Body>
                    </Card>

                    <div className="d-flex justify-content-between mt-4">
                        <Button variant="outline-secondary" onClick={() => props.setShowActivateAdModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={activateAd} 
                            disabled={loading || !landingurl}
                            className="px-4"
                        >
                            {loading ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                    Activating...
                                </>
                            ) : 'Activate Ad'}
                        </Button>
                    </div>

                </Form>
            </Modal.Body>
        </Modal>
    </>)
}

export default ActivateAdModal