import { useState, useRef } from "react";
import {
  Form,
  Button,
  Tabs,
  Tab,
  Container,
  Row,
  Col,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  InputGroup,
  Card
} from "react-bootstrap";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import logo from "../../Naav logo.svg";
import axios from "axios";
import "../../App.css";

const AuthPage = ({ setUser }) => {
  const [signindata, setSignindata] = useState({ username: "", password: "" });
  const [signupdata, setSignupdata] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmpassword: "",
    usertype: "",
  });
  const [activeTab, setActiveTab] = useState("login");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const usernameRef = useRef(null);

  const handleSigninChange = (e) => {
    setSignindata({ ...signindata, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    
    // Allow only numbers in the phone field
    if (name === "phone" && value !== "" && !/^\d+$/.test(value)) {
      return;
    }

    setSignupdata({ ...signupdata, [name]: value });
  };

  const handleUserTypeChange = (val) => {
    setSignupdata({ ...signupdata, usertype: val });
    // Automatically focus on the username input field right after selecting a user type
    setTimeout(() => {
      usernameRef.current?.focus();
    }, 50);
  };

  const handleTabSelect = (k) => {
    setActiveTab(k);
    setError(""); // Clear error when switching tabs
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post("http://localhost:5000/user/login", signindata);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userid", response.data.userid);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("usertype", response.data.usertype);
      setUser({
        userid: response.data.userid,
        username: response.data.username,
        usertype: response.data.usertype,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login Failed! Username/Password Incorrect.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (signupdata.password !== signupdata.confirmpassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!signupdata.usertype) {
      setError("Please select a user type!");
      return;
    }

    try {
      const {confirmpassword, ...payload} = signindata;
      const response = await axios.post("http://localhost:5000/user/create", signupdata);
      alert("Signup successful! You can now log in.");
      setActiveTab("login"); // Redirect to login tab after success
    } catch (err) {
      setError(err.response?.data?.message || "Signup Failed! Please try again.");
    }
  };

  const passwordsMatch =
    signupdata.password &&
    signupdata.confirmpassword &&
    signupdata.password === signupdata.confirmpassword;

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100 py-5 bg-light">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                
                <h3 className="fw-bold text-dark">Welcome to LocalAds</h3>
                <p className="text-muted">Manage your ads &amp; reach your audience.</p>
              </div>

              {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

              <Tabs
                activeKey={activeTab}
                id="auth-tabs"
                className="mb-4 custom-tabs border-bottom-0 justify-content-center"
                onSelect={handleTabSelect}
              >
                {/* Login Tab */}
                <Tab eventKey="login" title={<span className="px-3 fw-semibold">Login</span>}>
                  <Form onSubmit={handleSignin} className="mt-3">
                    <Form.Group className="mb-3">
                      <Form.Label className="text-muted small fw-bold">Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        placeholder="Enter username"
                        value={signindata.username}
                        onChange={handleSigninChange}
                        className="py-2 rounded-3 bg-light border-0"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted small fw-bold">Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showLoginPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter password"
                          value={signindata.password}
                          onChange={handleSigninChange}
                          className="py-2 rounded-start-3 bg-light border-0"
                          required
                        />
                        <Button 
                          variant="light" 
                          className="bg-light border-0 text-muted rounded-end-3 px-3"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                        >
                          <i className={`bi ${showLoginPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Button type="submit" variant="primary" className="w-100 py-2 rounded-3 fw-bold" style={{ backgroundColor: '#534AB7', border: 'none' }}>
                      Sign In
                    </Button>
                  </Form>
                </Tab>

                {/* Signup Tab */}
                <Tab eventKey="signup" title={<span className="px-3 fw-semibold">Register</span>}>
                  <Form onSubmit={handleSignup} className="mt-3">
                    <Row>
                      <Col sm={12}>
                        <Form.Group className="mb-4 text-center">
                          <Form.Label className="d-block mb-2 small fw-bold text-muted">
                            Select Account Type <span className="text-danger">*</span>
                          </Form.Label>
                          <ToggleButtonGroup
                            type="radio"
                            name="usertype"
                            value={signupdata.usertype}
                            onChange={handleUserTypeChange}
                            className="w-100 p-1 bg-light rounded-pill shadow-sm"
                          >
                            <ToggleButton
                              id="usertype-advertiser"
                              value="ADVERTISER"
                              variant={signupdata.usertype === "ADVERTISER" ? "primary" : "light"}
                              className={`w-50 border-0 rounded-pill fw-semibold ${signupdata.usertype === "ADVERTISER" ? "" : "text-muted"}`}
                              style={signupdata.usertype === "ADVERTISER" ? { backgroundColor: '#534AB7' } : {}}
                            >
                              Advertiser
                            </ToggleButton>
                            <ToggleButton
                              id="usertype-developer"
                              value="DEVELOPER"
                              variant={signupdata.usertype === "DEVELOPER" ? "success" : "light"}
                              className={`w-50 border-0 rounded-pill fw-semibold ${signupdata.usertype === "DEVELOPER" ? "" : "text-muted"}`}
                            >
                              Developer
                            </ToggleButton>
                          </ToggleButtonGroup>
                        </Form.Group>
                      </Col>

                      <Col sm={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="text-muted small fw-bold">Username</Form.Label>
                          <Form.Control
                            ref={usernameRef}
                            type="text"
                            name="username"
                            placeholder="Choose a username"
                            value={signupdata.username}
                            onChange={handleSignupChange}
                            className="py-2 rounded-3 bg-light border-0"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="text-muted small fw-bold">Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            placeholder="Email address"
                            value={signupdata.email}
                            onChange={handleSignupChange}
                            className="py-2 rounded-3 bg-light border-0"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="text-muted small fw-bold">Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            placeholder="Phone number"
                            value={signupdata.phone}
                            onChange={handleSignupChange}
                            className="py-2 rounded-3 bg-light border-0"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label className="text-muted small fw-bold">Password</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showSignupPassword ? "text" : "password"}
                          name="password"
                          placeholder="Create password"
                          value={signupdata.password}
                          onChange={handleSignupChange}
                          className="py-2 rounded-start-3 bg-light border-0"
                          required
                        />
                        <Button 
                          variant="light" 
                          className="bg-light border-0 text-muted rounded-end-3 px-3"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                        >
                          <i className={`bi ${showSignupPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted small fw-bold">Confirm Password</Form.Label>
                      <InputGroup hasValidation>
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmpassword"
                          placeholder="Re-enter password"
                          value={signupdata.confirmpassword}
                          onChange={handleSignupChange}
                          className="py-2 rounded-start-3 bg-light border-0"
                          required
                          isInvalid={signupdata.confirmpassword && signupdata.password !== signupdata.confirmpassword}
                        />
                        <Button 
                          variant="light" 
                          className="bg-light border-0 text-muted rounded-end-3 px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          Passwords do not match
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="success"
                      className="w-100 py-2 rounded-3 fw-bold"
                      disabled={!passwordsMatch || !signupdata.usertype}
                    >
                      Create Account
                    </Button>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
            <Card.Footer className="bg-white border-0 text-center py-4">
              <span className="text-muted small">Want to use our Ad Service on your Website or App? </span>
              <a href="#" className="small fw-bold text-decoration-none" style={{ color: '#534AB7' }}>Developer Login</a>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthPage;