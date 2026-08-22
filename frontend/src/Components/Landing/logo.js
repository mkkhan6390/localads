import React from "react";
import { Navbar } from "react-bootstrap";

const Logo = () => {
  return (
    <Navbar.Brand href="#home" className="d-flex align-items-center gap-2">
      <span className="fs-2">
        <span className="fw-light text-secondary">Local</span>
        <span className="fw-bold text-primary">Ads</span>
        <i className="bi bi-megaphone-fill text-primary fs-3"></i>
      </span>
    </Navbar.Brand>
  );
};

export default Logo;