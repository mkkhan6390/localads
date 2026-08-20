// import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsMegaphone } from 'react-icons/bs';
import Hero from './Hero';
import Features from './Features';
import Testimonials from './Testimonials';
import Footer from './Footer';

const Home = ({ isLoggedIn }) => {

  return (
    <>
      <Navbar bg="light" expand="lg" fixed="top" className="shadow-sm">
        <Container>

          <Navbar.Brand
            href="#home" className="d-flex align-items-center gap-2">
            <span className="fs-2">
              <span className="fw-light text-secondary">Local</span>
              <span className="fw-bold text-primary">Ads</span>
              <i className="bi bi-megaphone-fill text-primary fs-3"></i>
            </span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center gap-3">
              <Nav.Link href="#features" className="fw-medium">Features</Nav.Link>
              <Nav.Link href="#testimonials" className="fw-medium">Testimonials</Nav.Link>
              <Nav.Link href="#pricing" className="fw-medium">Pricing</Nav.Link>
              <Link to={isLoggedIn() ? "/dashboard" : "/login"} className="text-decoration-none">
                <Button variant="primary" className="ms-2">{isLoggedIn() ? 'Dashboard' : 'Get Started'}</Button>
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