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

  // Create a ref for the username input field in the Register tab
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
      console.log("logged in :", response.data);
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
      console.error("Login Error:", err.response?.data || err.message);
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
      console.log("Signup success:", response.data);
      alert("Signup successful! You can now log in.");
    } catch (err) {
      console.error("Signup Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Signup Failed! Please try again.");
    }
  };

  const passwordsMatch =
    signupdata.password &&
    signupdata.confirmpassword &&
    signupdata.password === signupdata.confirmpassword;

  return (
    <Container className="min-vh-100 d-flex justify-content-center align-items-center">
      <Row className="justify-content-center mt-1 mb-1">
        <Col md={12} className="p-5 shadow rounded bg-white" style={{ minWidth: "325px" }}>
          <div className="text-center mb-1">
            <img src={logo} alt="Naav Logo" height={80} width={80} />
            <h3 className="mt-2">Welcome to Naav</h3>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Tabs
            defaultActiveKey="login"
            id="auth-tabs"
            className="mb-3 custom-tabs"
            fill
            onSelect={handleTabSelect}
          >
            {/* Login Tab */}
            <Tab eventKey="login" title="Login">
              <Form onSubmit={handleSignin}>
                <Form.Group className="mb-1">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    placeholder="Enter username"
                    value={signindata.username}
                    onChange={handleSigninChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={signindata.password}
                    onChange={handleSigninChange}
                    required
                  />
                </Form.Group>

                <Button type="submit" variant="info" className="w-100 text-dark fw-bold">
                  Login
                </Button>
              </Form>
            </Tab>

            {/* Signup Tab */}
            <Tab eventKey="signup" title="Register">
              <Form onSubmit={handleSignup}>
                <Row>
                  <Col>
                    <Form.Group className="mb-1">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        ref={usernameRef} // Attached the reference here
                        type="text"
                        name="username"
                        placeholder="Choose a username"
                        value={signupdata.username}
                        onChange={handleSignupChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col>
                    {/* User Type Switch */}
                    <Form.Group className="mb-4 text-center">
                      <Form.Label className="d-block mb-2 fw-bold text-success">
                        User Type <span className="text-danger">*</span>
                      </Form.Label>
                      <ToggleButtonGroup
                        type="radio"
                        name="usertype"
                        value={signupdata.usertype}
                        onChange={handleUserTypeChange}
                        className="w-100 p-1 bg-light border rounded shadow-sm"
                      >
                        <ToggleButton
                          id="usertype-advertiser"
                          value="ADVERTISER"
                          variant={signupdata.usertype === "ADVERTISER" ? "primary" : "outline-secondary"}
                          className="w-50 border-0 fw-semibold"
                        >
                          Advertiser
                        </ToggleButton>
                        <ToggleButton
                          id="usertype-developer"
                          value="DEVELOPER"
                          variant={signupdata.usertype === "DEVELOPER" ? "success" : "outline-secondary"}
                          className="w-50 border-0 fw-semibold"
                        >
                          Developer
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-1">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={signupdata.email}
                    onChange={handleSignupChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-1">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    placeholder="Enter phone number"
                    value={signupdata.phone}
                    onChange={handleSignupChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={signupdata.password}
                    onChange={handleSignupChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmpassword"
                    placeholder="Re-enter password"
                    value={signupdata.confirmpassword}
                    onChange={handleSignupChange}
                    required
                    isInvalid={
                      signupdata.confirmpassword &&
                      signupdata.password !== signupdata.confirmpassword
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    Passwords do not match
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  variant="success"
                  className="w-100 fw-bold"
                  disabled={!passwordsMatch || !signupdata.usertype}
                >
                  Sign Up
                </Button>
              </Form>
            </Tab>
          </Tabs>

          <div className="text-center">
            Want to use our Ad Service on your Website or App?{" "}
            <a href="#">Developer Login</a>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthPage;