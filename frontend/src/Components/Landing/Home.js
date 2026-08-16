// import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsMegaphone } from 'react-icons/bs';
import Hero from './Hero';
import Features from './Features';
import Testimonials from './Testimonials';
import Footer from './Footer';

const Home = ({isLoggedIn}) =>{

    return(
        <>
         <Navbar variant="light" expand="lg" fixed="top" className="shadow-sm" style={{ backgroundColor: '#f7f6fd' }}>
            <Container>
              {/* <Navbar.Brand href="#home" className="d-flex align-items-center">
                <span
                  className="d-flex align-items-center justify-content-center me-2"
                  style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#534AB7' }}
                >
                  <BsMegaphone color="#fff" size={15} />
                </span>
                <span className="fw-semibold" style={{ color: '#111' }}>Local Ads</span>
              </Navbar.Brand> */}
              <Navbar.Brand href="#home" className="d-flex align-items-center gap-2">
  <span className="fs-2">
    <span className="fw-light text-secondary">Local</span>
    <span className="fw-bold text-primary">Ads</span>
    <i className="bi bi-megaphone-fill text-primary fs-3"></i>
  </span>
</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="ms-auto align-items-lg-center">
                  <Nav.Link href="#features" style={{ color: '#666' }}>Features</Nav.Link>
                  <Nav.Link href="#testimonials" style={{ color: '#666' }}>Testimonials</Nav.Link>
                  <Nav.Link href="#pricing" style={{ color: '#666' }}>Pricing</Nav.Link>
                  <Link to={isLoggedIn() ? "/dashboard" : "/login"}>
                    <Button
                      className="ms-2 fw-semibold"
                      style={{ backgroundColor: '#534AB7', border: 'none', borderRadius: 8 }}
                    >
                      {isLoggedIn() ? 'Dashboard' : 'Get Started'}
                    </Button>
                  </Link>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
          <Hero />
          <Features />
          <Testimonials />
          <Footer />
        </>
    )
   
}

export default Home;