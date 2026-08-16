import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Navbar, Nav, Button, Row, Col, Card, Badge, Spinner, Alert, Toast, ToastContainer, OverlayTrigger, Popover, Form, Dropdown, ButtonGroup } from "react-bootstrap";
import api from "../../api";
import NewAdModal from "./newAd";
import ActivateAdModal from "./ActivateAd";
import Statistics from "./statistics";
import Profile from "./profile";
import PublisherApps from "./publisherApps";
import { BsPlusCircle, BsBoxArrowRight, BsPencil, BsEye, BsCursor, BsMegaphone, BsBarChart, BsPerson, BsGrid, BsSearch, BsSortDown } from "react-icons/bs";

const Dashboard = ({ user }) => {
  const [userData, setUserData] = useState(null);
  const [showNewAdModal, setShowNewAdModal] = useState(false);
  const [showActivateAdModal, setShowActivateAdModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("ads");
  const [stats, setStats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [sortBy, setSortBy] = useState("date_new");

  const navigate = useNavigate();
  const usertype = user?.usertype || localStorage.getItem("usertype");

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

  useEffect(() => {
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userid = localStorage.getItem('userid');
        const response = await api.post(`http://localhost:5000/dashboard/stats/${userid}`);
        setStats(response.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchStats();
  }, [navigate]);

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
    setSelectedAd(event.currentTarget.id);
    setShowNewAdModal(true);
    setToastMessage("Loading ad details for editing");
    setShowToast(true);
  };

  // Dynamic counts based on ad data
  const totalAdsCount = userData?.ads ? userData.ads.length : 0;
  const activeAdsCount = userData?.ads ? userData.ads.filter(ad => Number(ad.isactive) === 1).length : 0;
  const inactiveAdsCount = userData?.ads ? userData.ads.filter(ad => Number(ad.isactive) !== 1).length : 0;

  // Search + Status Filter + Sort
  const getFilteredAndSortedAds = () => {
    if (!userData?.ads) return [];
    let result = [...userData.ads];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(ad =>
        (ad.title || "").toLowerCase().includes(q) ||
        (ad.description || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter === "active") {
      result = result.filter(ad => Number(ad.isactive) === 1);
    } else if (statusFilter === "inactive") {
      result = result.filter(ad => Number(ad.isactive) !== 1);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date_old":
          return new Date(a.added_date || 0) - new Date(b.added_date || 0);
        case "views":
          return (Number(b.views) || 0) - (Number(a.views) || 0);
        case "clicks":
          return (Number(b.clicks) || 0) - (Number(a.clicks) || 0);
        case "date_new":
        default:
          return new Date(b.added_date || 0) - new Date(a.added_date || 0);
      }
    });

    return result;
  };

  const filteredAds = getFilteredAndSortedAds();

  const sortLabels = {
    date_new: "Date Created (Newest First)",
    date_old: "Date Created (Oldest First)",
    views: "Views (High to Low)",
    clicks: "Clicks (High to Low)",
  };

  const profilePopover = (
    <Popover id="profile-popover" style={{ minWidth: 260, borderRadius: 12, border: '1px solid #e0e0e0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
      <Popover.Body className="p-3">
        <div className="d-flex align-items-center mb-3 pb-2 border-bottom">
          <div
            className="d-flex align-items-center justify-content-center fw-bold me-3"
            style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#534AB7', color: '#fff', fontSize: 16 }}
          >
            {userData?.username ? userData.username.slice(0, 2).toUpperCase() : '??'}
          </div>
          <div>
            <h6 className="mb-0 fw-bold">{userData?.username || 'User'}</h6>
            <Badge bg="primary" style={{ backgroundColor: '#534AB7', fontSize: 10 }}>
              {usertype || 'USER'}
            </Badge>
          </div>
        </div>

        {usertype === 'ADVERTISER' && (
          <div className="p-2 mb-3 rounded" style={{ backgroundColor: '#f7f6fd' }}>
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>Active Ads:</span>
              <strong style={{ color: '#534AB7' }}>{activeAdsCount}</strong>
            </div>
            <div className="d-flex justify-content-between small text-muted">
              <span>Total Campaign Ads:</span>
              <strong style={{ color: '#333' }}>{totalAdsCount}</strong>
            </div>
          </div>
        )}

        <div className="d-grid gap-1">
          <Button
            variant="light"
            size="sm"
            className="d-flex align-items-center justify-content-start text-dark fw-medium border-0 py-2"
            onClick={() => {
              setActiveTab("profile");
              document.body.click();
            }}
          >
            <BsPerson className="me-2 text-primary" size={16} /> View Profile
          </Button>

          <hr className="my-1 text-muted" />

          <Button
            variant="light"
            size="sm"
            className="d-flex align-items-center justify-content-start text-danger fw-medium border-0 py-2"
            onClick={handleLogout}
          >
            <BsBoxArrowRight className="me-2" size={16} /> Log Out
          </Button>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#FFFBEB' }}>
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
        <Container fluid className="flex-grow-1 d-flex flex-column px-0">
          <div className="sticky-top pt-3 px-3" style={{ zIndex: 1030 }}>
            <Navbar
              expand="lg"
              variant="light"
              className="shadow-sm mx-auto px-3"
              style={{
                backgroundColor: 'rgba(247, 246, 253, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.6)'
              }}
            >
              <Container fluid>
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
                  <span className="fs-2">
                    <span className="fw-light text-secondary">Local</span>
                    <span className="fw-bold text-primary">Ads</span>
                    <i className="bi bi-megaphone-fill text-primary fs-3"></i>
                  </span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="main-navbar" />
                <Navbar.Collapse id="main-navbar">
                  <Nav
                    className="mx-auto my-2 my-lg-0 p-1"
                    style={{ backgroundColor: 'rgba(236, 234, 254, 0.7)', borderRadius: 10, gap: 2 }}
                  >
                    {usertype === 'ADVERTISER' && (
                      <Nav.Link
                        active={activeTab === "ads"}
                        onClick={() => setActiveTab("ads")}
                        className="d-flex align-items-center px-3 py-2"
                        style={activeTab === "ads"
                          ? { backgroundColor: '#fff', color: '#3C3489', fontWeight: 600, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
                          : { color: '#666', borderRadius: 8 }}
                      >
                        <BsMegaphone className="me-2" size={14} /> Advertisements
                      </Nav.Link>
                    )}
                    {usertype === 'ADVERTISER' && (
                      <Nav.Link
                        active={activeTab === "stats"}
                        onClick={() => setActiveTab("stats")}
                        className="d-flex align-items-center px-3 py-2"
                        style={activeTab === "stats"
                          ? { backgroundColor: '#fff', color: '#3C3489', fontWeight: 600, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
                          : { color: '#666', borderRadius: 8 }}
                      >
                        <BsBarChart className="me-2" size={14} /> Statistics
                      </Nav.Link>
                    )}
                    {usertype === 'DEVELOPER' && (
                      <Nav.Link
                        active={activeTab === "apps"}
                        onClick={() => setActiveTab("apps")}
                        className="d-flex align-items-center px-3 py-2"
                        style={activeTab === "apps"
                          ? { backgroundColor: '#fff', color: '#3C3489', fontWeight: 600, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
                          : { color: '#666', borderRadius: 8 }}
                      >
                        <BsGrid className="me-2" size={14} /> My Apps
                      </Nav.Link>
                    )}
                  </Nav>
                  <Nav className="ms-auto d-flex align-items-center gap-3">
                    {usertype === 'ADVERTISER' && (
                      <Button
                        size="sm"
                        className="d-flex align-items-center fw-semibold"
                        style={{ backgroundColor: '#F59E0B', border: 'none', borderRadius: 8 }}
                        onClick={handleNewAdButton}
                      >
                        <BsPlusCircle className="me-2" /> Create Ad
                      </Button>
                    )}

                    <OverlayTrigger
                      trigger="click"
                      placement="bottom-end"
                      rootClose
                      overlay={profilePopover}
                    >
                      <button
                        type="button"
                        className="btn p-0 border-0 d-flex align-items-center justify-content-center"
                        style={{ outline: 'none' }}
                      >
                        <span
                          title={userData.username}
                          className="d-flex align-items-center justify-content-center fw-semibold"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: '#EEEDFE',
                            color: '#3C3489',
                            fontSize: 13,
                            cursor: 'pointer',
                            border: '2px solid #534AB7'
                          }}
                        >
                          {userData.username ? userData.username.slice(0, 2).toUpperCase() : '??'}
                        </span>
                      </button>
                    </OverlayTrigger>
                  </Nav>
                </Navbar.Collapse>
              </Container>
            </Navbar>
          </div>

          <Container className="py-4 flex-grow-1">
            {activeTab === "ads" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4>Your Advertisements</h4>
                </div>

                {/* 🔹 Dynamic Summary Metric Card */}
                <Row className="mb-4 g-3">
                  <Col xs={12} sm={4}>
                    <Card className="border-0 shadow-sm rounded-4 p-2">
                      <Card.Body className="p-2 d-flex align-items-center justify-content-between">
                        <div>
                          <div className="text-muted small fw-medium">
                            {statusFilter === "all" && "Total Ads"}
                            {statusFilter === "active" && "Total Active Ads"}
                            {statusFilter === "inactive" && "Total Inactive Ads"}
                          </div>
                          <div className="fs-3 fw-bold">
                            {statusFilter === "all" && totalAdsCount}
                            {statusFilter === "active" && activeAdsCount}
                            {statusFilter === "inactive" && inactiveAdsCount}
                          </div>
                        </div>
                        <div
                          className="d-flex align-items-center justify-content-center rounded-3 p-2"
                          style={{
                            backgroundColor:
                              statusFilter === "active" ? '#e8f5e9' :
                              statusFilter === "inactive" ? '#ffebee' : '#ede7f6',
                            color:
                              statusFilter === "active" ? '#2e7d32' :
                              statusFilter === "inactive" ? '#c62828' : '#512da8'
                          }}
                        >
                          <BsMegaphone size={20} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Search Bar + Status Filters + Sort */}
                <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
                  <div style={{ position: 'relative', minWidth: 260, flex: '1 1 260px', maxWidth: 360 }}>
                    <BsSearch
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }}
                    />
                    <Form.Control
                      type="text"
                      placeholder="Search ads by title or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: 36, borderRadius: 8 }}
                    />
                  </div>

                  <ButtonGroup>
                    <Button
                      size="sm"
                      variant={statusFilter === "all" ? "dark" : "outline-secondary"}
                      style={statusFilter === "all" ? { backgroundColor: '#534AB7', borderColor: '#534AB7' } : {}}
                      onClick={() => setStatusFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={statusFilter === "active" ? "success" : "outline-secondary"}
                      onClick={() => setStatusFilter("active")}
                    >
                      Active
                    </Button>
                    <Button
                      size="sm"
                      variant={statusFilter === "inactive" ? "secondary" : "outline-secondary"}
                      onClick={() => setStatusFilter("inactive")}
                    >
                      Inactive
                    </Button>
                  </ButtonGroup>

                  <Dropdown className="ms-auto">
                    <Dropdown.Toggle
                      size="sm"
                      variant="outline-secondary"
                      className="d-flex align-items-center"
                    >
                      <BsSortDown className="me-2" /> {sortLabels[sortBy]}
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                      <Dropdown.Item active={sortBy === "date_new"} onClick={() => setSortBy("date_new")}>
                        Date Created (Newest First)
                      </Dropdown.Item>
                      <Dropdown.Item active={sortBy === "date_old"} onClick={() => setSortBy("date_old")}>
                        Date Created (Oldest First)
                      </Dropdown.Item>
                      <Dropdown.Item active={sortBy === "views"} onClick={() => setSortBy("views")}>
                        Views (High to Low)
                      </Dropdown.Item>
                      <Dropdown.Item active={sortBy === "clicks"} onClick={() => setSortBy("clicks")}>
                        Clicks (High to Low)
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {userData.ads && userData.ads.length > 0 ? (
                  filteredAds.length > 0 ? (
                    <Row xs={1} md={2} lg={3} className="g-4">
                      {filteredAds.map(ad => (
                        // <Col key={ad.id}>
                        //   <Card className="h-100 shadow-sm hover-shadow" style={{ position: 'relative' }}>
                        //     <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                        //       {Number(ad.isactive) === 1
                        //         ? <Badge bg="success" pill>✓ Active</Badge>
                        //         : <Badge bg="secondary" pill>Inactive</Badge>
                        //       }
                        //     </div>
                        //     <Card.Img
                        //       variant="top"
                        //       src={ad.ad_url}
                        //       alt={ad.title}
                        //       style={{ height: '180px', objectFit: 'cover' }}
                        //     />
                        //     <Card.Body>
                        //       <Card.Title>{ad.title}</Card.Title>
                        //       <Card.Text className="text-muted small">
                        //         {ad.description.length > 100 ?
                        //           `${ad.description.substring(0, 100)}...` :
                        //           ad.description
                        //         }
                        //       </Card.Text>
                        //       <div className="d-flex gap-3 mt-2 pt-2 border-top">
                        //         <span className="small text-muted d-flex align-items-center">
                        //           <BsEye className="me-1" /> {ad.views ?? 0} views
                        //         </span>
                        //         <span className="small text-muted d-flex align-items-center">
                        //           <BsCursor className="me-1" /> {ad.clicks ?? 0} clicks
                        //         </span>
                        //       </div>
                        //     </Card.Body>
                        //     <Card.Footer className="bg-white border-0">
                        //       <div className="d-flex justify-content-between align-items-center">
                        //         <Button
                        //           variant="outline-secondary"
                        //           size="sm"
                        //           id={ad.id}
                        //           onClick={handleEditButton}
                        //           className="d-flex align-items-center"
                        //         >
                        //           <BsPencil className="me-1" /> Edit
                        //         </Button>
                        //         {Number(ad.isactive) !== 1 && (
                        //           <Button
                        //             variant="success"
                        //             size="sm"
                        //             id={ad.id}
                        //             onClick={handleActivateButton}
                        //           >
                        //             Activate
                        //           </Button>
                        //         )}
                        //       </div>
                        //     </Card.Footer>
                        //   </Card>
                        // </Col>
                        <Col key={ad.id}>
  <Card className="h-100 glass-card border-0">
    {/* Dynamic Active/Inactive Badge */}
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
      {Number(ad.isactive) === 1 ? (
        <Badge
          pill
          style={{
            backgroundColor: 'rgba(22, 163, 74, 0.85)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            padding: '6px 12px'
          }}
        >
          ✓ Active
        </Badge>
      ) : (
        <Badge
          pill
          style={{
            backgroundColor: 'rgba(100, 116, 139, 0.85)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            padding: '6px 12px'
          }}
        >
          Inactive
        </Badge>
      )}
    </div>

    {/* Ad Image Container with Frosted Text Overlay */}
    <div className="glass-img-container">
      <img src={ad.ad_url} alt={ad.title} className="glass-img" />

      {/* Frosted Glass Overlay Pane */}
      <div className="glass-overlay">
        <h5 className="fw-bold mb-1 text-dark">{ad.title}</h5>
        <p className="text-secondary small mb-2" style={{ lineHeight: '1.3' }}>
          {ad.description.length > 80
            ? `${ad.description.substring(0, 80)}...`
            : ad.description}
        </p>

        <div className="d-flex gap-3 pt-1 border-top border-white-50">
          <span className="small text-muted d-flex align-items-center">
            <BsEye className="me-1 text-primary" /> {ad.views ?? 0} views
          </span>
          <span className="small text-muted d-flex align-items-center">
            <BsCursor className="me-1 text-primary" /> {ad.clicks ?? 0} clicks
          </span>
        </div>
      </div>
    </div>

    {/* Card Action Footer */}
    <Card.Footer className="bg-white border-0 p-3">
      <div className="d-flex justify-content-between align-items-center">
        <Button
          variant="outline-secondary"
          size="sm"
          id={ad.id}
          onClick={handleEditButton}
          className="d-flex align-items-center rounded-2 px-3"
        >
          <BsPencil className="me-1" /> Edit
        </Button>
        {Number(ad.isactive) !== 1 && (
          <Button
            variant="success"
            size="sm"
            id={ad.id}
            onClick={handleActivateButton}
            className="rounded-2 px-3 fw-medium"
            style={{ backgroundColor: '#10B981', border: 'none' }}
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
                        <h5>No ads match your filters</h5>
                        <p className="text-muted">Try a different search term or change the status filter.</p>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                        >
                          Clear filters
                        </Button>
                      </Card.Body>
                    </Card>
                  )
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
                        <BsPlusCircle className="me-2" /> Create Ad
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
                <Profile user={user} />
              </>
            )}

            {activeTab === "apps" && (
              <>
                <h4 className="mb-4">My Publisher Apps</h4>
                <PublisherApps />
              </>
            )}
          </Container>

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

      <ActivateAdModal
        setShowActivateAdModal={setShowActivateAdModal}
        showActivateAdModal={showActivateAdModal}
        selectedAd={selectedAd}
        onSuccess={fetchData}
      />
      <NewAdModal
        setShowNewAdModal={setShowNewAdModal}
        showNewAdModal={showNewAdModal}
        selectedAd={selectedAd}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default Dashboard;