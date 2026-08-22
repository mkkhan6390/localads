import { Container, Row, Col, Button } from 'react-bootstrap';
import growthlogo from '../../growth.png';
import heroBg from '../../hero-bg.png'; // Path to your downloaded background image

function Hero() {
  return (
    <div
      className="hero-section py-5"
      style={{
        marginTop: '76px',
        position: 'relative',
        overflow: 'hidden',
        // Background image settings
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#f8fafc',
      }}
    >
      <Container className="py-5" style={{ position: 'relative', zIndex: 1 }}>
        <Row className="align-items-center">
          <Col lg={6} className="text-center text-lg-start">
            <h1 className="display-4 fw-bold mb-4 text-white">
              Amplify Your Reach with{" "}
              <a
                href="#home"
                className="text-decoration-none d-inline-flex align-items-center">
                <span style={{ fontSize: "3.5rem" }}>
                  <span className="fw-light text-secondary">Local</span>
                  <span className="fw-bold text-primary">Ads</span>
                  <i className="bi bi-megaphone-fill text-primary ms-2"
                    style={{ fontSize: "2.8rem" }}></i>
                </span>
              </a>
            </h1>
            <p className="lead mb-4" style={{ color: '#cbd5e1' }}>
              Connect with millions of users across multiple platforms.
              Showcase your advertisements on premium apps and websites.
            </p>
            <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
              <Button variant="primary" size="lg" className="px-4 py-2">
                Start Advertising
              </Button>
              <Button variant="outline-light" size="lg" className="px-4 py-2">
                Learn More
              </Button>
            </div>
          </Col>
          <Col lg={6} className="mt-5 mt-lg-0 text-center">
            <img
              src={growthlogo}
              alt="Platform Growth Chart"
              className="img-fluid"
              style={{ filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5))' }}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Hero;