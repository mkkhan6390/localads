import { useState } from "react";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Alert,
  InputGroup,
  Card
} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../../App.css";
import { API_URL } from "../../api";

const Register = () => {
  const [signupdata, setSignupdata] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmpassword: "",
    usertype: "ADVERTISER",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignupChange = (e) => {
    const { name, value } = e.target;

    // Allow only numbers in the phone field
    if (name === "phone" && value !== "" && !/^\d+$/.test(value)) {
      return;
    }

    setSignupdata({ ...signupdata, [name]: value });
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
      await axios.post(`${API_URL}/user/create`, signupdata);
      alert("Signup successful! You can now log in.");
      navigate("/login"); // Redirect to login page after success
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

              <h5 className="fw-semibold text-center mb-4">Register as Advertiser</h5>

              <Form onSubmit={handleSignup} className="mt-3">
                <Row>
                  <Col sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-muted small fw-bold">Username</Form.Label>
                      <Form.Control
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

              <div className="text-center mt-4">
                <span className="text-muted small">Already have an account? </span>
                <Link to="/login" className="small fw-bold text-decoration-none" style={{ color: '#534AB7' }}>
                  Login
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
