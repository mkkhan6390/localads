import { Container, Row, Col } from 'react-bootstrap';

function Footer() {
  return (
    <footer className="bg-dark text-light py-4">
      <Container>
        <Row>
          <Col md={4} className="mb-4 mb-md-0">
            <h5>LocalAds</h5>
            <p className="text-muted">
              Connecting advertisers with premium platforms for maximum reach and impact.
            </p>
          </Col>
          <Col md={2} className="mb-4 mb-md-0">
            <h6>Company</h6>
            <ul className="list-unstyled">
              <li><a href="#about" className="text-muted text-decoration-none">About</a></li>
              <li><a href="#careers" className="text-muted text-decoration-none">Careers</a></li>
              <li><a href="#contact" className="text-muted text-decoration-none">Contact</a></li>
            </ul>
          </Col>
          <Col md={2} className="mb-4 mb-md-0">
            <h6>Resources</h6>
            <ul className="list-unstyled">
              <li><a href="#blog" className="text-muted text-decoration-none">Blog</a></li>
              <li><a href="#guides" className="text-muted text-decoration-none">Guides</a></li>
              <li><a href="#help" className="text-muted text-decoration-none">Help Center</a></li>
            </ul>
          </Col>
          <Col md={4}>
            <h6>Subscribe to our newsletter</h6>
            <div className="input-group mb-3">
              <input type="email" className="form-control" placeholder="Enter your email" />
              <button className="btn btn-primary" type="button">Subscribe</button>
            </div>
          </Col>
        </Row>
        <hr className="my-4" />
        <div className="text-center text-muted">
          <small>&copy; 2024 LocalAds. All rights reserved.</small>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;