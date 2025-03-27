import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Modal, Form, OverlayTrigger, Tooltip, Tab, Nav, Row, Col, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { useFormik } from 'formik';
import * as Yup from 'yup';

function NewAdModal(props) {

  const [adData, setAdData] = useState({})
  const fields = ['file', 'userid', 'title', 'description', 'pincode', 'displaylevel', 'type']


  const validateFields = (form) => {
    return fields.every(fieldName => form.elements[fieldName].checkValidity());
  };

  const createAd = async (event) => {

    // event.preventDefault();
    // event.stopPropagation();

    const token = localStorage.getItem("token");//need to handle case where login session has expired
    const formData = new FormData();
    formData.append("file", formik.values.file);
    formData.append("userid", formik.values.userid);
    formData.append("title", formik.values.title);
    formData.append("description", formik.values.description);
    formData.append("pincode", formik.values.pincode);
    formData.append("level", formik.values.displaylevel);
    formData.append("type", formik.values.type);

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


  const formik = useFormik({
    initialValues: {},
    validationSchema: Yup.object({
      type: Yup.string().required('Please select an ad type.'),
      file: Yup.mixed().required('Please upload a file.'),
      title: Yup.string().required('Title is required.'),
      description: Yup.string().required('Description is required.'),
      pincode: Yup.string()
        .required('Pincode is required.')
        .matches(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit pincode.'),
      displaylevel: Yup.string().required('Please select a display level.'),
    }),
    onSubmit: createAd,
  });

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
          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Ad Type</Form.Label>
              <Form.Select
                name="type"
                value={formik.values.type || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
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
              {formik.touched.type && formik.errors.type && <div className="text-danger">{formik.errors.type}</div>}
            </Form.Group>

            <Form.Group controlId="file" className="mb-3">
              <Form.Label>Ad File</Form.Label>
              <Form.Control
                type="file"
                name="file"
                onChange={(event) => formik.setFieldValue('file', event.currentTarget.files[0])}
                onBlur={formik.handleBlur} />
              {formik.touched.file && formik.errors.file && <div className="text-danger">{formik.errors.file}</div>}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter ad title"
              />
              {formik.touched.title && formik.errors.title && <div className="text-danger">{formik.errors.title}</div>}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ad Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter ad description"
              />
              {formik.touched.description && formik.errors.description && <div className="text-danger">{formik.errors.description}</div>}
            </Form.Group>

            <Form.Group controlId="pincode" className="mb-3">
              <Form.Label>Pincode</Form.Label>
              <Form.Control
                type="number"
                name="pincode"
                value={formik.values.pincode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter pincode"
              />
              {formik.touched.pincode && formik.errors.pincode && <div className="text-danger">{formik.errors.pincode}</div>}
            </Form.Group>

            <Form.Group controlId="displaylevel" className="mb-3">
              <Form.Label>Display Level</Form.Label>
              <Form.Select
                name="displaylevel"
                value={formik.values.displaylevel}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value='' >Select Display Level</option>
                <option value="1">City</option>
                <option value="2">District</option>
                <option value="2">State</option>
                <option value="3">Country</option>
              </Form.Select>
              {formik.touched.displaylevel && formik.errors.displaylevel && <div className="text-danger">{formik.errors.displaylevel}</div>}

            </Form.Group>
            <div className="text-end">


              <Button type='submit' className='float-right mx-3' title="Create Ad" variant="primary">
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