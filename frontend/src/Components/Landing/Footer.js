import { Container, Row, Col, Form, Button } from "react-bootstrap";

function Footer() {
  const mutedStyle = { color: 'rgba(255,255,255,0.65)' };
  return (
    <footer className="bg-dark text-light pt-5 pb-3">
      <Container>
        <Row className="gy-4">

          {/* Brand */}
          <Col lg={4}>
            <h3 className="fw-bold mb-3">
              <i className="bi bi-megaphone-fill text-primary me-2"></i>
              <span className="fw-light text-secondary">Local</span>
              <span className="fw-bold text-primary">Ads</span>
            </h3>

            <p className="text-secondary mb-4">
              Connecting advertisers with premium platforms for maximum
              reach and impact.
            </p>
          </Col>

          {/* Company */}
          <Col sm={6} lg={2}>
            <h6 className="text-uppercase fw-bold mb-3"> Company </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#about" className="text-secondary text-decoration-none">
                  About
                </a>
              </li>

              <li className="mb-2">
                <a href="#careers" className="text-secondary text-decoration-none">
                  Careers
                </a>
              </li>

              <li>
                <a href="#contact" className="text-secondary text-decoration-none">
                  Contact
                </a>
              </li>
            </ul>
          </Col>

          {/* Resources */}
          <Col sm={6} lg={2}>
            <h6 className="text-uppercase fw-bold mb-3">
              Resources
            </h6>

            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#blog" className="text-secondary text-decoration-none">Blog</a>
              </li>

              <li className="mb-2">
                <a href="#guides" className="text-secondary text-decoration-none">Guides</a>
              </li>

              <li>
                <a href="#help" className="text-secondary text-decoration-none">Help Center </a>
              </li>

            </ul>
          </Col>

          {/* Newsletter */}
          <Col lg={4}>
            <h6 className="text-uppercase fw-bold mb-3">
              Newsletter
            </h6>

            <p className="text-secondary small">
              Stay updated with the latest advertising trends.
            </p>

            <Form className="d-flex">
              <Form.Control
                type="email"
                placeholder="Enter your email"
                className="me-2"
              />

              <Button variant="primary">
                Subscribe
              </Button>
            </Form>
          </Col>

        </Row>
        <hr className="border-secondary my-4" />

        <Row className="align-items-center">

          <Col md={6} className="text-center text-md-start">
            <small className="text-secondary">
              © 2026 LocalAds. All rights reserved.
            </small>
          </Col>

          <Col md={6} className="text-center text-md-end mt-3 mt-md-0">

            <a href="#privacy" className="text-secondary text-decoration-none me-3">Privacy</a>

            <a href="#terms" className="text-secondary text-decoration-none me-3">Terms</a>

            <a href="#cookies" className="text-secondary text-decoration-none"> Cookies</a>

          </Col>

        </Row>

      </Container>
    </footer>
  );
}

export default Footer;