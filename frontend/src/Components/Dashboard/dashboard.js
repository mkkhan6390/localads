import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Navbar, Nav, Button, Row, Col, Card, Spinner, Alert, Toast, ToastContainer } from "react-bootstrap";
import api from "../../api";
import logo from '../../Naav logo.svg';
import NewAdModal from "./newAd";
import ActivateAdModal from "./ActivateAd";
import Statistics from "./statistics";
import Profile from "./profile";
import PublisherApps from "./publisherApps";
import { BsPlusCircle, BsBoxArrowRight, BsPencil } from "react-icons/bs";

// const stats = [
// {
//   "_id": {
//     "$oid": "68b1fc23dea955ccb7fa463e"
//   },
//   "adid": "3",
//   "month": 8,
//   "year": 2025,
//   "apps": {
//     "0c8e2b0e-84b9-11f0-bfe2-c85b7660b47d": {
//       "clicks": 10
//     },
//     "915f89f1-84e1-11f0-bfe2-c85b7660b47d": {
//       "clicks": 10,
//       "views": 4
//     }
//   },
//   "datetimes": {
//     "2025": {
//       "aug": {
//         "week5": {
//           "29": {
//             "clickss": 10,
//             "day": "fri",
//             "viewss": 2,
//             "clicks": 10,
//             "views": 2
//           }
//         }
//       }
//     }
//   },
//   "regions": {
//     "416520": {
//       "clicks": 20,
//       "views": 4
//     }
//   },
//   "total_clicks": 20,
//   "total_views": 4,
//   "unique_clicks": 1,
//   "unique_views": 1
// }
// ]

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [showNewAdModal, setShowNewAdModal] = useState(false);
  const [showActivateAdModal, setShowActivateAdModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("ads"); // 🔹 active tab
  const [stats, setStats] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.get("http://localhost:5000/dashboard", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
      } catch (err) {
        console.log(err);
        setError("Failed to load dashboard data. Please try again.");
        localStorage.removeItem("token");
        localStorage.removeItem("userid");
        localStorage.removeItem("username");
        localStorage.removeItem("usertype");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userid = localStorage.getItem('userid')
        const response = await api.post(`http://localhost:5000/dashboard/stats/${userid}`);
        setStats(response.data);
      } catch (err) {
        console.log(err);
      }
    }

    fetchStats()
  }, [navigate])

  const handleNewAdButton = () => {
    setSelectedAd(-1);
    setShowNewAdModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userid");
    localStorage.removeItem("username");
    localStorage.removeItem("usertype");
    navigate("/login");
  };

  const handleActivateButton = (event) => {
    setSelectedAd(event.target.id);
    setShowActivateAdModal(true);
    setToastMessage("Preparing to activate your ad");
    setShowToast(true);
  };

  const handleEditButton = (event) => {
    setSelectedAd(event.target.id);
    setShowNewAdModal(true);
    setToastMessage("Loading ad details for editing");
    setShowToast(true);
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* 🔹 Toast */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      ) : userData ? (
        <Container fluid className="flex-grow-1 d-flex flex-column">
          {/* 🔹 Navbar with Tabs */}
          <Navbar expand="lg" className="bg-body-tertiary shadow-sm sticky-top">
            <Container fluid>
              <Navbar.Brand className="d-flex align-items-center">
                {/* <img src={logo} alt="Naav Logo" height={40} width={70} className="me-2" /> */}
                <Link to='/'>
                  <span className="d-none d-md-inline">Local Ads</span>
                </Link>
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="main-navbar" />
              <Navbar.Collapse id="main-navbar">
                <Nav className="me-auto">
                  <Nav.Link
                    active={activeTab === "ads"}
                    onClick={() => setActiveTab("ads")}
                  >
                    Advertisements
                  </Nav.Link>
                  <Nav.Link
                    active={activeTab === "stats"}
                    onClick={() => setActiveTab("stats")}
                  >
                    Statistics
                  </Nav.Link>
                  <Nav.Link
                    active={activeTab === "profile"}
                    onClick={() => setActiveTab("profile")}
                  >
                    Profile
                  </Nav.Link>
                  <Nav.Link
                    active={activeTab === "apps"}
                    onClick={() => setActiveTab("apps")}
                  >
                    My Apps
                  </Nav.Link>
                </Nav>
                <Nav className="ms-auto d-flex align-items-center">
                  <span className="me-3 d-none d-md-block">Welcome, <strong>{userData.username}</strong></span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="d-flex align-items-center"
                    onClick={handleLogout}
                  >
                    <BsBoxArrowRight className="me-2" /> Log Out
                  </Button>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>

          {/* 🔹 Content Area (based on tab) */}
          <Container className="py-4 flex-grow-1">
            {activeTab === "ads" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4>Your Advertisements</h4>
                  <Button variant="primary" onClick={handleNewAdButton}>
                    <BsPlusCircle className="me-2" /> New Ad
                  </Button>
                </div>
                {userData.ads && userData.ads.length > 0 ? (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {userData.ads.map(ad => (
                      <Col key={ad.id}>
                        <Card className="h-100 shadow-sm hover-shadow">
                          <Card.Img
                            variant="top"
                            src={ad.ad_url}
                            alt={ad.title}
                            style={{ height: '180px', objectFit: 'cover' }}
                          />
                          <Card.Body>
                            <Card.Title>{ad.title}</Card.Title>
                            <Card.Text className="text-muted small">
                              {ad.description.length > 100 ?
                                `${ad.description.substring(0, 100)}...` :
                                ad.description
                              }
                            </Card.Text>
                          </Card.Body>
                          <Card.Footer className="bg-white border-0">
                            <div className="d-flex justify-content-between">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                id={ad.id}
                                onClick={handleEditButton}
                                className="d-flex align-items-center"
                              >
                                <BsPencil className="me-1" /> Edit
                              </Button>
                              {!ad.isactive && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  id={ad.id}
                                  onClick={handleActivateButton}
                                >
                                  Activate
                                </Button>
                              )}
                            </div>
                          </Card.Footer>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Card className="text-center p-5 shadow-sm">
                    <Card.Body>
                      <h5>You don't have any ads yet</h5>
                      <p className="text-muted">Create your first ad to start promoting your business</p>
                      <Button
                        variant="primary"
                        onClick={handleNewAdButton}
                        className="mt-3 d-inline-flex align-items-center"
                      >
                        <BsPlusCircle className="me-2" /> Create New Ad
                      </Button>
                    </Card.Body>
                  </Card>
                )}
              </>
            )}

            {activeTab === "stats" && (
              <>
                <h4 className="mb-4">Your Ad Statistics</h4>
                <Statistics adsData={stats} />
              </>
            )}

            {activeTab === "profile" && (
              <>
                <h4 className="mb-4">Your Profile</h4>
                <p><strong>Username:</strong> {userData.username}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <Profile />
              </>
            )}

            {activeTab === "apps" && (
              <>
                <h4 className="mb-4">My Publisher Apps</h4>
                <PublisherApps />
              </>
            )}
          </Container>

          {/* 🔹 Footer */}
          <footer className="bg-dark text-white text-center py-3 mt-auto">
            <Container>
              <Row>
                <Col>
                  <p className="mb-0">© 2025 Naav Developers. All rights reserved.</p>
                </Col>
              </Row>
            </Container>
          </footer>
        </Container>
      ) : null}

      {/* Modals */}
      <ActivateAdModal
        setShowActivateAdModal={setShowActivateAdModal}
        showActivateAdModal={showActivateAdModal}
        selectedAd={selectedAd}
      />
      <NewAdModal
        setShowNewAdModal={setShowNewAdModal}
        showNewAdModal={showNewAdModal}
        selectedAd={selectedAd}
      />
    </div>
  );
};

export default Dashboard;
