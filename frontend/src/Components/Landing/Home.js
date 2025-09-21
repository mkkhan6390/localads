// import 'bootstrap/dist/css/bootstrap.min.css';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Hero from './Hero';
import Features from './Features';
import Testimonials from './Testimonials';
import Footer from './Footer';

const Home = ({isLoggedIn}) =>{

    return(
        <>
         <Navbar bg="light" expand="lg" fixed="top" className="shadow-sm">
            <Container>
              <Navbar.Brand href="#home">LocalAds</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="ms-auto">
                  <Nav.Link href="#features">Features</Nav.Link>
                  <Nav.Link href="#testimonials">Testimonials</Nav.Link>
                  <Nav.Link href="#pricing">Pricing</Nav.Link>
                  <Link to={isLoggedIn() ? "/dashboard" : "/login"}>
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