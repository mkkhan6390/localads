import React, { useState } from "react";
import { Card, Nav, Form, Button, InputGroup, FormControl, Alert, Badge, Row, Col } from "react-bootstrap";
import { Eye, EyeOff, Copy, RefreshCw, User, Mail, ShieldCheck, Grid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api, { API_URL } from "../../api";

const PRIMARY = "#534AB7";

// Keep validation in sync with backend/routes/users.js
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const Profile = ({ user, userData, onUpdate }) => {
    const navigate = useNavigate();
    const userid = user?.userid || localStorage.getItem("userid");
    const usertype = user?.usertype || userData?.usertype || localStorage.getItem("usertype");
    const username = userData?.username || user?.username || localStorage.getItem("username") || "User";

    // Ad Statistics calculations
    const ads = userData?.ads || [];
    const totalAds = ads.length;
    const activeAds = ads.filter(ad => ad.isactive === 1).length;

    const [activeSection, setActiveSection] = useState("overview");

    // Contact info state
    const [email, setEmail] = useState(userData?.email || "");
    const [phone, setPhone] = useState(userData?.phone || "");
    const [savingEmail, setSavingEmail] = useState(false);
    const [savingPhone, setSavingPhone] = useState(false);
    const [emailMessage, setEmailMessage] = useState(null);
    const [phoneMessage, setPhoneMessage] = useState(null);

    // Security state
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState(null);

    const [apiKey, setApiKey] = useState(null);
    const [showKey, setShowKey] = useState(false);

    const requireToken = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return null;
        }
        return token;
    };

    const extractErrorMessage = (error, fallback) => {
        const data = error?.response?.data;
        if (typeof data === "string") return data;
        if (data?.message) return data.message;
        return error?.message || fallback;
    };

    // ----- Contact Info handlers -----
    const handleSaveEmail = async (e) => {
        e.preventDefault();
        setEmailMessage(null);

        if (!EMAIL_REGEX.test(email)) {
            setEmailMessage({ type: "danger", text: "Please enter a valid email address." });
            return;
        }

        const token = requireToken();
        if (!token) return;

        setSavingEmail(true);
        try {
            await api.patch(
                `${API_URL}/user/email/${userid}`,
                { email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEmailMessage({ type: "success", text: "Email updated successfully." });
            onUpdate && onUpdate();
        } catch (error) {
            setEmailMessage({ type: "danger", text: extractErrorMessage(error, "Failed to update email.") });
        } finally {
            setSavingEmail(false);
        }
    };

    const handleSavePhone = async (e) => {
        e.preventDefault();
        setPhoneMessage(null);

        if (!PHONE_REGEX.test(phone)) {
            setPhoneMessage({ type: "danger", text: "Please enter a valid phone number." });
            return;
        }

        const token = requireToken();
        if (!token) return;

        setSavingPhone(true);
        try {
            await api.patch(
                `${API_URL}/user/phone/${userid}`,
                { phone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPhoneMessage({ type: "success", text: "Phone number updated successfully." });
            onUpdate && onUpdate();
        } catch (error) {
            setPhoneMessage({ type: "danger", text: extractErrorMessage(error, "Failed to update phone number.") });
        } finally {
            setSavingPhone(false);
        }
    };

    // ----- Security handlers -----
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (!PASSWORD_REGEX.test(newPassword)) {
            setPasswordMessage({
                type: "danger",
                text: "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character."
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "danger", text: "Passwords do not match." });
            return;
        }

        const token = requireToken();
        if (!token) return;

        setSavingPassword(true);
        try {
            await api.patch(
                `${API_URL}/user/password/${userid}`,
                { newpassword: newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPasswordMessage({ type: "success", text: "Password changed successfully." });
            setNewPassword("");
            setConfirmPassword("");
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (error) {
            setPasswordMessage({ type: "danger", text: extractErrorMessage(error, "Failed to change password.") });
        } finally {
            setSavingPassword(false);
        }
    };

    // 🔑 Generate/Reset API Key
    const generateApiKey = async () => {
        const token = requireToken();
        if (!token) return;

        try {
            const response = await api.patch(`${API_URL}/user/genkey`, {}, { headers: { authorization: `Bearer ${token}` } });
            setApiKey(response.data.apikey)
            setShowKey(false);
        } catch (error) {
            alert(error.message)
        }
    }

    const fetchApiKey = async () => {
        const token = requireToken();
        if (!token) return;

        try {
            const response = await api.get(`${API_URL}/user/key`, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data.apikey) {
                setApiKey(response.data.apikey)
                setShowKey(false);
            } else {
                if (window.confirm("Api Key has not been generated yet. Generate now?")) {
                    return await generateApiKey()
                }
            }
        } catch (error) {
            alert(error.message)
        }
    };

    const copyToClipboard = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            alert("API Key copied to clipboard!");
        }
    };

    const sections = [
        { key: "overview", label: "Overview", icon: <Grid size={16} /> },
        { key: "edit", label: "Edit Contact", icon: <Mail size={16} /> },
        { key: "security", label: "Security", icon: <ShieldCheck size={16} /> },
    ];

    // Helper for generating avatar initials
    const getInitials = (name) => {
        return name ? name.substring(0, 2).toUpperCase() : "U";
    };

    return (
        <Card className="shadow-sm border-0 rounded-4 overflow-hidden mx-auto" style={{ maxWidth: "850px" }}>
            {/* Profile Header Block */}
            <div 
                className="bg-light p-4 d-flex align-items-center" 
                style={{ borderBottom: "1px solid #eaeaea", background: `linear-gradient(to right, #f7f6fd, #ffffff)` }}
            >
                <div 
                    className="d-flex justify-content-center align-items-center text-white rounded-circle shadow-sm me-4"
                    style={{ width: 80, height: 80, backgroundColor: PRIMARY, fontSize: 32, fontWeight: 'bold' }}
                >
                    {getInitials(username)}
                </div>
                <div>
                    <h3 className="mb-1 fw-bold text-dark">{username}</h3>
                    <div className="d-flex align-items-center gap-2">
                        <Badge bg={usertype === "DEVELOPER" ? "success" : "primary"} className="px-3 py-1 rounded-pill" style={{ letterSpacing: 0.5 }}>
                            {usertype || "USER"}
                        </Badge>
                        <span className="text-muted small">
                            <Mail size={14} className="me-1" />
                            {email || "No email set"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-4">
                <Nav
                    className="mb-4 p-1 flex-nowrap"
                    style={{ backgroundColor: "#f7f6fd", borderRadius: 10, gap: 2, display: "inline-flex", overflowX: "auto" }}
                >
                    {sections.map((s) => (
                        <Nav.Link
                            key={s.key}
                            active={activeSection === s.key}
                            onClick={() => setActiveSection(s.key)}
                            className="d-flex align-items-center px-3 py-2 text-nowrap"
                            style={
                                activeSection === s.key
                                    ? { backgroundColor: "#fff", color: PRIMARY, fontWeight: 600, borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }
                                    : { color: "#666", borderRadius: 8 }
                            }
                        >
                            <span className="me-2 d-flex align-items-center">{s.icon}</span> {s.label}
                        </Nav.Link>
                    ))}
                </Nav>

                {activeSection === "overview" && (
                    <div className="animate__animated animate__fadeIn">
                        <h6 className="mb-4 fw-bold text-muted text-uppercase" style={{ letterSpacing: 1 }}>Profile Overview</h6>
                        
                        {/* Ads Statistic Card */}
                        <div 
                            className="p-3 mb-4 rounded-3 d-inline-block" 
                            style={{ backgroundColor: "#f8f9ff", minWidth: "240px" }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-secondary" style={{ fontSize: "15px" }}>Active Ads:</span>
                                <span className="fw-bold fs-5" style={{ color: PRIMARY }}>{activeAds}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-secondary" style={{ fontSize: "15px" }}>Total Campaign Ads:</span>
                                <span className="fw-bold fs-5 text-dark">{totalAds}</span>
                            </div>
                        </div>

                        <Row className="g-4">
                            <Col md={6}>
                                <Card className="border-0 bg-light rounded-4 p-3 h-100">
                                    <p className="text-muted small mb-1">Username</p>
                                    <h5 className="mb-0 text-dark">{username}</h5>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 bg-light rounded-4 p-3 h-100">
                                    <p className="text-muted small mb-1">Account Role</p>
                                    <h5 className="mb-0 text-dark">{usertype || "N/A"}</h5>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 bg-light rounded-4 p-3 h-100">
                                    <p className="text-muted small mb-1">Email Address</p>
                                    <h5 className="mb-0 text-dark">{email || "Not Provided"}</h5>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="border-0 bg-light rounded-4 p-3 h-100">
                                    <p className="text-muted small mb-1">Phone Number</p>
                                    <h5 className="mb-0 text-dark">{phone || "Not Provided"}</h5>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}

                {activeSection === "edit" && (
                    <div className="animate__animated animate__fadeIn">
                        <h6 className="mb-4 fw-bold text-muted text-uppercase" style={{ letterSpacing: 1 }}>Update Contact Details</h6>

                        <Form onSubmit={handleSaveEmail} className="mb-4">
                            <Form.Label className="small text-muted fw-semibold">Email Address</Form.Label>
                            {emailMessage && (
                                <Alert variant={emailMessage.type} onClose={() => setEmailMessage(null)} dismissible className="py-2 rounded-3">
                                    {emailMessage.text}
                                </Alert>
                            )}
                            <InputGroup className="shadow-sm rounded-pill">
                                <FormControl
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="rounded-start-pill py-2 border-end-0"
                                />
                                <Button type="submit" variant="primary" disabled={savingEmail} className="rounded-end-pill px-4" style={{ backgroundColor: PRIMARY, border: "none" }}>
                                    {savingEmail ? "Saving..." : "Save Email"}
                                </Button>
                            </InputGroup>
                        </Form>

                        <Form onSubmit={handleSavePhone}>
                            <Form.Label className="small text-muted fw-semibold">Phone Number</Form.Label>
                            {phoneMessage && (
                                <Alert variant={phoneMessage.type} onClose={() => setPhoneMessage(null)} dismissible className="py-2 rounded-3">
                                    {phoneMessage.text}
                                </Alert>
                            )}
                            <InputGroup className="shadow-sm rounded-pill">
                                <FormControl
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="9876543210"
                                    className="rounded-start-pill py-2 border-end-0"
                                />
                                <Button type="submit" variant="primary" disabled={savingPhone} className="rounded-end-pill px-4" style={{ backgroundColor: PRIMARY, border: "none" }}>
                                    {savingPhone ? "Saving..." : "Save Phone"}
                                </Button>
                            </InputGroup>
                        </Form>
                    </div>
                )}

                {activeSection === "security" && (
                    <div className="animate__animated animate__fadeIn">
                        <h6 className="mb-4 fw-bold text-muted text-uppercase" style={{ letterSpacing: 1 }}>Security Settings</h6>

                        <div className="mb-5 bg-light p-4 rounded-4">
                            <h6 className="mb-3 fw-bold">Change Password</h6>
                            {passwordMessage && (
                                <Alert variant={passwordMessage.type} onClose={() => setPasswordMessage(null)} dismissible className="py-2 rounded-3">
                                    {passwordMessage.text}
                                </Alert>
                            )}
                            <Form onSubmit={handleChangePassword}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-semibold">New Password</Form.Label>
                                    <InputGroup className="shadow-sm rounded-pill">
                                        <Form.Control
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="rounded-start-pill py-2 border-end-0"
                                        />
                                        <Button variant="white" className="bg-white border text-muted" onClick={() => setShowNewPassword(!showNewPassword)}>
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </Button>
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-semibold">Confirm New Password</Form.Label>
                                    <InputGroup className="shadow-sm rounded-pill">
                                        <Form.Control
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="rounded-start-pill py-2 border-end-0"
                                        />
                                        <Button variant="white" className="bg-white border text-muted" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </Button>
                                    </InputGroup>
                                </Form.Group>

                                <Form.Text className="text-muted d-block mb-3 small">
                                    Must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.
                                </Form.Text>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    style={{ backgroundColor: PRIMARY, border: "none" }}
                                    className="rounded-pill px-4 py-2 w-100 fw-bold shadow-sm"
                                    disabled={savingPassword}
                                >
                                    {savingPassword ? "Updating..." : "Update Password"}
                                </Button>
                            </Form>
                        </div>

                        {usertype === "DEVELOPER" && (
                            <div className="pt-3 border-top">
                                <h6 className="mb-3 fw-bold">API Key Configuration</h6>
                                {apiKey ? (
                                    <InputGroup className="shadow-sm rounded-pill">
                                        <FormControl
                                            type="text"
                                            value={showKey ? apiKey : "•••••••••••••••••••••••••••••"}
                                            readOnly
                                            className="rounded-start-pill py-2 bg-light border-end-0"
                                            style={{ fontFamily: "monospace" }}
                                        />
                                        <Button variant="white" className="bg-white border text-muted" onClick={() => setShowKey(!showKey)}>
                                            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </Button>
                                        <Button variant="white" className="bg-white border text-muted" onClick={copyToClipboard} title="Copy Key">
                                            <Copy size={18} />
                                        </Button>
                                        <Button variant="danger" onClick={generateApiKey} className="d-flex align-items-center rounded-end-pill px-3">
                                            <RefreshCw size={16} className="me-2" /> Reset
                                        </Button>
                                    </InputGroup>
                                ) : (
                                    <Button
                                        variant="outline-primary"
                                        onClick={fetchApiKey}
                                        className="rounded-pill px-4 py-2 fw-bold"
                                        style={{ borderColor: PRIMARY, color: PRIMARY }}
                                    >
                                        Reveal My API Key
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default Profile;