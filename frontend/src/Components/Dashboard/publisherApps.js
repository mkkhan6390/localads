import React, { useState, useEffect } from "react";
import api from "../../api";
import { Copy, CheckCircle, Plus } from "lucide-react";
import {
  Button,
  Card,
  Form,
  Spinner,
  Alert,
  Modal,
  Row,
  Col,
} from "react-bootstrap";

export default function PublisherApps() {
  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    appName: "",
    appType: "website",
    appIdentifier: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  // For copy script feedback
  const [copiedAppId, setCopiedAppId] = useState(null);

  // Fetch apps from backend
  const fetchApps = async () => {
    setLoadingApps(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("http://localhost:5000/apps", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApps(res.data); // expect array of apps
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load your apps.");
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        "http://localhost:5000/apps/add",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add new app to state
      await fetchApps()

      // Reset and close modal
      setFormData({ appName: "", appType: "website", appIdentifier: "", description: "" });
      setShowModal(false);
    } catch (err) {
      console.error("Error adding app:", err);
      setErrorMsg("Failed to register app. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (script, appId) => {
    navigator.clipboard.writeText(script);
    setCopiedAppId(appId);
    setTimeout(() => setCopiedAppId(null), 2000);
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Your Registered Apps</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={18} className="me-2" /> Add New App
        </Button>
      </div>

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      {loadingApps ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : apps.length === 0 ? (
        <p>No apps registered yet. Click "Add New App" to get started.</p>
      ) : (
        <Row xs={1} md={2} className="g-4">
          {apps.map((app) => {

            //give the option to choose sdk type for vanilla js, react, vue, android, ios, etc
            //for react.js
            // useEffect(() => {
            //     const script = document.createElement("script");
            //     script.src = "http://localhost:5000/sdk";
            //     script.async = true;
  
            //     // add custom attributes
            //     script.setAttribute("username", "mkhan6390");
            //     script.setAttribute("appid", "0c8e2b0e-84b9-11f0-bfe2-c85b7660b47d");
            //     script.setAttribute("apikey", "$2a$10$pRDeD2axZz7Xj0oe3wbvROYsZAyUyk.b8lsY1XIpo8SnT8uOlcFqe");
            //     script.setAttribute("adtype", "image");
  
            //     document.body.appendChild(script);
  
            //     return () => {
            //       document.body.removeChild(script); // cleanup on unmount
            //     };
            // }, []);

            const embedScript = `
            <script async src="http://localhost:5000/sdk"
              username="${app.username}"
              appid="${app.id}"
              apikey="${app.apikey}"
              adtype="image"
            </script>`;

            return (
              <Col key={app._id || app.appId}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title>{app.name}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {app.type} — {app.app_identifier}
                    </Card.Subtitle>
                    <Card.Text>{app.description}</Card.Text>

                    <p className="small text-muted mb-1">Embed Script:</p>
                    <pre className="bg-light p-2 rounded small border text-break">
                      {embedScript}
                    </pre>

                    <Button
                      variant={copiedAppId === app._id ? "success" : "secondary"}
                      size="sm"
                      onClick={() =>
                        copyToClipboard(embedScript, app._id)
                      }
                      className="d-flex align-items-center gap-2"
                    >
                      {copiedAppId === app._id ? (
                        <>
                          <CheckCircle size={16} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> Copy Script
                        </>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Modal for adding new app */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Register New App</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                name="appName"
                placeholder="Application/Website Name"
                value={formData.appName}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Select
                name="appType"
                value={formData.appType}
                onChange={handleChange}
              >
                <option value="website">Website</option>
                <option value="mobile">Mobile App</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                name="appIdentifier"
                placeholder="Website URL or App Package ID"
                value={formData.appIdentifier}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                name="description"
                placeholder="Short description of your app/site"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={saving} className="w-100">
              {saving ? <Spinner size="sm" animation="border" /> : "Register App"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
