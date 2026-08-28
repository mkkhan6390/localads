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

const Login = ({ setUser }) => {
  const [signindata, setSignindata] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const handleSigninChange = (e) => {
    setSignindata({ ...signindata, [e.target.name]: e.target.value });
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

              <h5 className="fw-semibold text-center mb-4">Login</h5>

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

              <div className="text-center mt-4">
                <span className="text-muted small">Don't have an account? </span>
                <Link to="/register" className="small fw-bold text-decoration-none" style={{ color: '#534AB7' }}>
                  Register
                </Link>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white border-0 text-center py-4">
              <span className="text-muted small">Want to use our Ad Service on your Website or App? </span>
              <Link to="/register/developer" className="small fw-bold text-decoration-none" style={{ color: '#534AB7' }}>Developer Login</Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
