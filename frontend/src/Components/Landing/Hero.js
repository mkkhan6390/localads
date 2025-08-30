import { Container, Row, Col, Button } from 'react-bootstrap';
import growthlogo from '../../growth.png';

function Hero() {
  return (
    <div className="hero-section bg-light py-5" style={{ marginTop: '76px' }}>
      <Container className="py-5">
        <Row className="align-items-center">
          <Col lg={6} className="text-center text-lg-start">
            <h1 className="display-4 fw-bold mb-4">Amplify Your Reach with LocalAds</h1>
            <p className="lead mb-4">
              Connect with millions of users across multiple platforms. 
              Showcase your advertisements on premium apps and websites.
            </p>
            <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
              <Button variant="primary" size="lg">Start Advertising</Button>
              <Button variant="outline-primary" size="lg">Learn More</Button>
            </div>
          </Col>
          <Col lg={6} className="mt-5 mt-lg-0">
            <img 
              src={growthlogo}
              alt="Platform Preview" 
            //   className="img-fluid rounded shadow"
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Hero;