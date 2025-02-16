import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Navbar, Nav, NavDropdown, Button, Row, Col } from "react-bootstrap";
import axios from "axios";
import logo from "./Naav logo.svg";
import NewAdModal from "./newAd"; 
import ActivateAdModal from "./ActivateAd";


const Dashboard = () => {
	const [userData, setUserData] = useState(null);
	const [showNewAdModal, setShowNewAdModal] = useState(false);
	const [showActivateAdModal, setShowActivateAdModal] = useState(false);
	const [selectedAd, setSelectedAd] = useState(null)

	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				navigate("/login");
				return;
			}

			try {
				const response = await axios.get("http://localhost:5000/dashboard", { headers: { Authorization: `Bearer ${token}` } });
				setUserData(response.data);
				console.log(response.data);
			} catch (err) {
				console.log(err);
				localStorage.removeItem("token");
				navigate("/login");
			}
		};

		fetchData();
	}, [navigate]);

	const handleNewAdButton = () => {
		setShowNewAdModal(true)
	}

	const handleLogout = () => {
		localStorage.removeItem("token");
		navigate("/login");
	};

	const handleActivateButton = (event) => {
		setSelectedAd(event.target.id)
		setShowActivateAdModal(true); 
	}

	return (
		<div>
			{userData ? (
				<Container fluid>
					<Row>
						<Navbar expand="lg" className="bg-body-tertiary">
							<Container>
								<Navbar.Brand href="#home">
									<img src={logo} alt="Naav Logo" height={40} width={70} />
								</Navbar.Brand>
								<Navbar.Toggle aria-controls="basic-navbar-nav" />
								<Navbar.Collapse id="basic-navbar-nav">
									<Nav className="me-auto">
										<Nav.Link href="#home">Home</Nav.Link>
										<Button onClick={handleNewAdButton}>New Ad</Button>
									</Nav>

								</Navbar.Collapse>

							</Container>
							<Navbar.Collapse className="justify-content-end">
								<Navbar.Text>
									<strong>{userData.username}</strong>
									<Button onClick={handleLogout} size="sm" className="mx-2">
										Log Out
									</Button>
								</Navbar.Text>
							</Navbar.Collapse>
						</Navbar>
					</Row>
					<hr />

					<Row className="m-3">

						{userData.ads.map(ad => {
							console.log(ad)
							return (
								<>
									<Navbar className="bg-body-tertiary">
										<Container className="row justify-content-around">
											<Col md={1} sm={12}>
												<img src={ad.url} alt={ad.title} height={70} width={100} />
											</Col>
											<Col md={5} sm={12}>
												<figure>
													<blockquote class="blockquote">
														<p>{ad.title}</p>
													</blockquote>
													<figcaption class="text-muted">
														{ad.description}
													</figcaption>
												</figure>
											</Col>
											<Col md={6} sm={12}>
											</Col>
											<Col md={1} sm={12}>
												{ad.isactive ? <></> : <Button variant="primary" id={ad.id} onClick={handleActivateButton}>Activate</Button>}
											</Col>
										</Container>
									</Navbar>
									<hr />
								</>
							);
						})}

					</Row>

					<Row>
						<footer className="bg-dark text-white text-center py-3 fixed-bottom">
							<p>© 2025 Naav Developers. All rights reserved.</p>
						</footer>
					</Row>
				</Container>
			) : (
				<p>Loading...</p>
			)}



			{showActivateAdModal ? (<ActivateAdModal setShowActivateAdModal={setShowActivateAdModal} showActivateAdModal={showActivateAdModal} selectedAd={selectedAd} />) : (<></>)}
			{showNewAdModal ? (<NewAdModal setShowNewAdModal={setShowNewAdModal} showNewAdModal={showNewAdModal} />) : (<></>)}
		</div>
	);
};

export default Dashboard;
