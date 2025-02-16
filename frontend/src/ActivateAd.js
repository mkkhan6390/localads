import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Modal, Form, OverlayTrigger, Tooltip, Tab, Nav, Row, Col, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'

function ActivateAdModal(props) {

    const [data, setData] = useState({})
    const [landingPageType, setLandingPageType] = useState('existing')
    const [platform, setPlatform] = useState('profilelink')
    const [landingurl, setLandingurl] = useState(null)
    const [phone, setPhone] = useState('')

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
        const token = localStorage.getItem("token");

        try {

            const response = await axios.get(`http://localhost:5000/ad/activate?id=${props.selectedAd}&landingurl=${landingurl}`, {
                headers: { authorization: `Bearer ${token}` }
            })

            console.log(response.data.message);
            alert(response.data.message);
            props.setShowActivateAdModal(false)
        } catch (error) {
            console.error("Error creating ad:", error);
            alert("Failed to create ad.");

        }

    }


    return (<>
        <Modal centered size="lg" show={props.showActivateAdModal} onHide={() => { props.setShowActivateAdModal(false) }}>
            <Modal.Header closeButton={true}> <div className="fs-6">Create New Ad</div> </Modal.Header>
            <Modal.Body className="m-1 p-3">
                <Form>
                    <div className="d-flex justify-content-center mt-5">
                        <ToggleButtonGroup type="radio" name="landingpagetype" value={landingPageType} onChange={handleCreateLandingPageRadio}>
                            <ToggleButton id="tbg-radio-1" value={'existing'} variant="outline-primary">
                                Use Existing Landing Page
                            </ToggleButton>
                            <ToggleButton id="tbg-radio-2" value={'social'} variant="outline-primary">
                                Use Your Social Media Page
                            </ToggleButton>
                            <ToggleButton value={'create'} variant="outline-primary">
                                <a href='' target="_blank">
                                Create Landing Page  <i class="bi bi-arrow-up-right-square-fill"></i>
                                </a>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>

                    {landingPageType === 'existing' ? <>
                        <Form.Group controlId="landing_url" className="m-3">
                            <Form.Control type="text" name="landing_url" value={landingurl} onChange={handleLandingurlChange} placeholder="Enter Landing Page Url" />
                        </Form.Group>

                    </> : <></>}

                    {landingPageType === 'social' ? <>
                        <Form.Group className="m-3">
                            <Form.Select name="type" value={platform} onChange={handlePlatformChange}>
                                <option value='profilelink'>
                                    Profile Link
                                </option>
                                <option value='whatsapp'>
                                    Whatsapp Link
                                </option>
                                <option value='phone'>
                                    Phone Number
                                </option>
                            </Form.Select>
                        </Form.Group>

                        {platform === 'profilelink' ? <>
                            <Form.Group controlId="profilelink" className="m2">
                                <Form.Control type="text" name="profilelink" value={landingurl} onChange={handleLandingurlChange} placeholder="Enter Landing Page Url" />
                            </Form.Group>
                        </> : <></>}
                        {['whatsapp', 'phone'].includes(platform) ? <>
                            <Form.Group controlId="phone" className="m2">
                                <Form.Control 
                                    type="text" 
                                    name="phone" 
                                    value={phone} 
                                    onChange={handleLandingurlChange} 
                                    placeholder={platform==='whatsapp'? "Enter Whatsapp number":"Enter Phone number"} />
                            </Form.Group>
                        </> : <></>}

                    </> : <></>}

                    {landingPageType === 'create' ? <>

                    </> : <></>}

                    <div className="text-end">
                        <Button className='float-right m-3' title="Create Ad" variant="primary" onClick={activateAd}>
                            Activate
                        </Button>
                    </div>

                </Form>
            </Modal.Body>
        </Modal>
    </>)
}

export default ActivateAdModal