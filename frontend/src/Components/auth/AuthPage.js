import { useState } from "react";
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
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../../Naav logo.svg";

const AuthPage = () => {
  const [signindata, setSignindata] = useState({ username: "", password: "" });
  const [signupdata, setSignupdata] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmpassword: "",
    usertype: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSigninChange = (e) => {
    setSignindata({ ...signindata, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupdata({ ...signupdata, [e.target.name]: e.target.value });
  };

  const handleUserTypeChange = (val) => {
    setSignupdata({ ...signupdata, usertype: val });
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/user/login", signindata);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userid", response.data.userid);
      navigate("/dashboard");
    } catch (err) {
      setError("Login Failed! Username/Password Incorrect.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupdata.password !== signupdata.confirmpassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!signupdata.usertype) {
      setError("Please select a user type!");
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/user/create", signupdata);
      console.log(response.data);
      alert("Signup successful! You can now log in.");
    } catch (err) {
      setError("Signup Failed! Please try again.");
      console.log("Signup Failed!!!\n", err);
    }
  };

  const passwordsMatch =
    signupdata.password &&
    signupdata.confirmpassword &&
    signupdata.password === signupdata.confirmpassword;

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Row>
        <Col md={12} className="p-4 shadow rounded bg-white" style={{ minWidth: "350px" }}>
          <div className="text-center mb-4">
            <img src={logo} alt="Naav Logo" height={80} width={80} />
            <h3 className="mt-2">Welcome to Naav</h3>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Tabs defaultActiveKey="login" id="auth-tabs" className="mb-3" fill>
            {/* Login Tab */}
            <Tab eventKey="login" title="Login">
              <Form onSubmit={handleSignin}>
                <Form.Group className="mb-3">
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

                <Button type="submit" variant="primary" className="w-100">
                  Login
                </Button>
              </Form>
            </Tab>

            {/* Signup Tab */}
            <Tab eventKey="signup" title="Register">
              <Form onSubmit={handleSignup}>
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
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
                      <Form.Label className="d-block mb-2">User Type</Form.Label>
                      <ToggleButtonGroup
                        type="radio"
                        name="usertype"
                        value={signupdata.usertype}
                        onChange={handleUserTypeChange}
                      >
                        <ToggleButton
                          id="usertype-advertiser"
                          value="ADVERTISER"
                          variant={signupdata.usertype === "ADVERTISER" ? "primary" : "outline-primary"}
                        >
                          Advertiser
                        </ToggleButton>
                        <ToggleButton
                          id="usertype-developer"
                          value="DEVELOPER"
                          variant={signupdata.usertype === "DEVELOPER" ? "success" : "outline-success"}
                        >
                          Developer
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
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

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
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
                  className="w-100"
                  disabled={!passwordsMatch || !signupdata.usertype}
                >
                  Sign Up
                </Button>
              </Form>
            </Tab>
          </Tabs>

          <div className="text-center mt-3">
            Want to use our Ad Service on your Website or App?{" "}
            <a href="#">Developer Login</a>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthPage;
