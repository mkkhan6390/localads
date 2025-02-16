import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Modal, Form, OverlayTrigger, Tooltip, Tab, Nav, Row, Col, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'

function NewAdModal(props) {

  const [adData, setAdData] = useState({})

  const createAd = async () => {

    const token = localStorage.getItem("token");//need to handle case where login session has expired
    const formData = new FormData();
    formData.append("file", adData.file);
    formData.append("userid", adData.userid);
    formData.append("title", adData.title);
    formData.append("description", adData.description);
    formData.append("pincode", adData.pincode);
    formData.append("level", adData.displaylevel);
    formData.append("type", adData.type);

    try {
      const response = await axios.post('http://localhost:5000/ad/create', formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: `Bearer ${token}`
        }
      })
      console.log("Success:", response.data);
      alert("Ad created successfully!");

    } catch (error) {

      console.error("Error creating ad:", error);
      alert("Failed to create ad.");

    } finally {
      props.setShowNewAdModal(false)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAdData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    setAdData((prev) => ({ ...prev, file: event.target.files[0] }));
  };


  // useEffect(() => { console.log(adData) }, [adData])
  return (
    <>
      <Modal centered size="lg" show={props.showNewAdModal} onHide={() => { props.setShowNewAdModal(false) }}>
        <Modal.Header closeButton={true}> <div className="fs-6">Create New Ad</div> </Modal.Header>
        <Modal.Body className="m-1 p-3">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Ad Type</Form.Label>
              <Form.Select name="type" value={adData.type || ''} onChange={handleChange}>
                <option name="type" value='' >
                  Select Ad Type
                </option>
                <option name="type" value='image'>
                  Image
                </option>
                <option name="type" value='audio'>
                  Audio
                </option>
                <option name="type" value='video'>
                  Video
                </option>
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="file" className="mb-3">
              <Form.Label>Ad File</Form.Label>
              <Form.Control type="file" name="file" onChange={handleFileChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control type="text" name="title" value={adData.title} onChange={handleChange} placeholder="Enter ad title" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ad Description</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={adData.description} onChange={handleChange} placeholder="Enter ad description" />
            </Form.Group>

            <Form.Group controlId="pincode" className="mb-3">
              <Form.Label>Pincode</Form.Label>
              <Form.Control type="number" name="pincode" value={adData.pincode} onChange={handleChange} placeholder="Enter pincode" />
            </Form.Group>

            <Form.Group controlId="displaylevel" className="mb-3">
              <Form.Label>Display Level</Form.Label>
              <Form.Select name="displaylevel" value={adData.displaylevel} onChange={handleChange}>
                <option value="1">City</option>
                <option value="2">District</option>
                <option value="2">State</option>
                <option value="3">Country</option>
              </Form.Select>
            </Form.Group>
            <div className="text-end">


              <Button className='float-right mx-3' title="Create Ad" variant="primary" onClick={createAd}>
                Create
              </Button>
            </div>
          </Form>
        </Modal.Body>
        {/* <Modal.Footer style={{justifyContent: "flex-start"}}>
					<p className="mx-1">Note : You cannot run campaign for a paused list. Please wait for the List to get completed or Stop the crawl Job to run a campaign on that list</p>
				</Modal.Footer> */}
      </Modal>
    </>
  )
}

export default NewAdModal