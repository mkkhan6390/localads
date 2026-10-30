import { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
// import growthlogo from '../../growth.png';
import heroBg from '../../hero-bg2.png'; // Path to your downloaded background image
import heroBg3 from '../../hero-bg3.png'; // 2nd slide: Digital Village

const heroSlides = [heroBg, heroBg3];
const SLIDE_INTERVAL = 5000; // 5 seconds per image

function Hero({ isLoggedIn }) {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const handleStartAdvertising = () => {
    navigate(isLoggedIn() ? '/dashboard' : '/login');
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="hero-section py-5"
      style={{
        marginTop: '76px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0b1b3a',
        color: '#f8fafc',
      }}
    >
      {/* Background slides (stay inside the hero, so they never touch the navbar) */}
      {heroSlides.map((img, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: activeSlide === i ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
            zIndex: 0,
          }}
        />
      ))}
      {/* Dark gradient on the left so the heading stays readable on both images */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(5,15,40,0.8) 0%, rgba(5,15,40,0.45) 45%, rgba(5,15,40,0) 70%)',
          zIndex: 0,
        }}
      />
      <Container className="py-5" style={{ position: 'relative', zIndex: 1 }}>
        <Row className="align-items-center">
          <Col lg={6} className="text-center text-lg-start">
            <h1 className="display-4 fw-bold mb-4 text-white">
              Amplify Your Reach with <span style={{ color: '#60a5fa' }}>LocalAds</span>
            </h1>
            <p className="lead mb-4" style={{ color: '#cbd5e1' }}>
              Connect with millions of users across multiple platforms. 
              Showcase your advertisements on premium apps and websites.
            </p>
            <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
              <Button variant="primary" size="lg" className="px-4 py-2" onClick={handleStartAdvertising}>
                Start Advertising
              </Button>
              <Button variant="outline-light" size="lg" className="px-4 py-2" onClick={handleLearnMore}>
                Learn More
              </Button>
            </div>
          </Col>
          {/* <Col lg={6} className="mt-5 mt-lg-0 text-center">
            <img 
              src={growthlogo}
              alt="Platform Growth Chart" 
              className="img-fluid"
              style={{ filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5))' }}
            />
          </Col> */}
        </Row>
      </Container>
    </div>
  );
}

export default Hero;