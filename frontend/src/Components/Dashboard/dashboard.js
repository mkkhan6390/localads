import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Navbar, Nav, Button, Row, Col, Card, Badge, Spinner, Alert, Toast, ToastContainer, OverlayTrigger, Popover, Form, Dropdown, ButtonGroup } from "react-bootstrap";
import api from "../../api";
import NewAdModal from "./newAd";
import ActivateAdModal from "./ActivateAd";
import Statistics from "./statistics";
import Profile from "./profile";
import PublisherApps from "./publisherApps";
import { BsPlusCircle, BsBoxArrowRight, BsPencil, BsEye, BsCursor, BsMegaphone, BsBarChart, BsPerson, BsGrid, BsSearch, BsSortDown, BsChevronLeft, BsChevronRight } from "react-icons/bs";

const Dashboard = ({ user,setLoggedIn }) => {
  const [selectedAdForStats, setSelectedAdForStats] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showNewAdModal, setShowNewAdModal] = useState(false);
  const [showActivateAdModal, setShowActivateAdModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState((user?.usertype || localStorage.getItem("usertype")) === "DEVELOPER" ? "apps":"ads");
  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive | expired
  const [sortBy, setSortBy] = useState("date_new");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 6;

  // New States for Expired Audit & Re-Launch Modals
  const [showExpiredAuditModal, setShowExpiredAuditModal] = useState(false);
  const [showReLaunchModal, setShowReLaunchModal] = useState(false);
  const [selectedExpiredAd, setSelectedExpiredAd] = useState(null);
  const [reLaunchForm, setReLaunchForm] = useState({
    title: "",
    description: "",
    targetUrl: "",
    mediaUrl: "",
    startDate: "",
    endDate: "",
    budget: "",
    isEditingCreative: false
  });

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
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        // Auth failure — clear session and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("userid");
        localStorage.removeItem("username");
        localStorage.removeItem("usertype");
        if (setLoggedIn) setLoggedIn(false);
        navigate("/");
      } else {
        // Server/network error — show error but keep session
        setError("Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // Load statistics every time the Statistics tab is opened, so numbers are always fresh
  // (previously this ran once on page load, so new views/clicks never showed up).
  useEffect(() => {
    if (activeTab !== "stats") return;

    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const userid = localStorage.getItem('userid');
        const response = await api.post(`http://localhost:5000/dashboard/stats/${userid}`);
        setStats(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.log(err);
        // Show the real reason instead of silently pretending there is simply no data.
        setStatsError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load statistics. Please try again."
        );
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [activeTab]);

  // Reset page when filters, query or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const handleNewAdButton = () => {
    setSelectedAd(-1);
    setShowNewAdModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userid");
    localStorage.removeItem("username");
    localStorage.removeItem("usertype");
    if (setLoggedIn) setLoggedIn(false);
    navigate("/");
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
  //Add state & click Handler for selected stat Ad
const handleDetailsButton = (adId) => {
  setSelectedAdForStats(adId);
  setActiveTab("stats");
};

  // Dynamic counts based on ad data
  const totalAdsCount = userData?.ads ? userData.ads.length : 0;
  const activeAdsCount = userData?.ads ? userData.ads.filter(ad => Number(ad.isactive) === 1 && Number(ad.is_expired) !== 1 && ad.status !== 'expired').length : 0;
  const inactiveAdsCount = userData?.ads ? userData.ads.filter(ad => Number(ad.isactive) !== 1 && Number(ad.is_expired) !== 1 && ad.status !== 'expired').length : 0;
  const expiredAdsCount = userData?.ads ? userData.ads.filter(ad => Number(ad.is_expired) === 1 || ad.status === 'expired').length : 0;

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
      result = result.filter(ad => Number(ad.isactive) === 1 && Number(ad.is_expired) !== 1 && ad.status !== 'expired');
    } else if (statusFilter === "inactive") {
      result = result.filter(ad => Number(ad.isactive) !== 1 && Number(ad.is_expired) !== 1 && ad.status !== 'expired');
    } else if (statusFilter === "expired") {
      result = result.filter(ad => Number(ad.is_expired) === 1 || ad.status === 'expired');
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

  // Pagination Calculation
  const totalPages = Math.ceil(filteredAds.length / adsPerPage);
  const indexOfLastAd = currentPage * adsPerPage;
  const indexOfFirstAd = indexOfLastAd - adsPerPage;
  const currentAds = filteredAds.slice(indexOfFirstAd, indexOfLastAd);

  // Helper function to build page numbers array with ellipses (...)
  const getPaginationRange = () => {
    const delta = 1;
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      } else if (
        (i === currentPage - delta - 1 && i > 1) ||
        (i === currentPage + delta + 1 && i < totalPages)
      ) {
        range.push("...");
      }
    }
    return range.filter((item, index, arr) => arr.indexOf(item) === index);
  };

  const sortLabels = {
    date_new: "Date Created (Newest First)",
    date_old: "Date Created (Oldest First)",
    views: "Views (High to Low)",
    clicks: "Clicks (High to Low)",
  };

  const profilePopover = (
    <Popover id="profile-popover" className="shadow border-0 rounded-4" style={{ minWidth: 260 }}>
      <Popover.Body className="p-3">
        <div className="d-flex align-items-center mb-3 pb-2 border-bottom">
          <div
            className="d-flex align-items-center justify-content-center fw-bold me-3 rounded-circle text-white"
            style={{ width: 44, height: 44, backgroundColor: '#534AB7', fontSize: 16 }}
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
              <strong className="text-dark">{totalAdsCount}</strong>
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
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Keyframe Animations utilizing Bootstrap Context Colors */}
      <style>{`
        @keyframes asteroidSweep {
          0% {
            left: -40%;
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            left: 110%;
            opacity: 0;
          }
        }

        @keyframes asteroidPulseOnce {
          0% {
            opacity: 0.2;
            box-shadow: 0 0 2px var(--bs-primary), 0 0 4px var(--bs-info);
            transform: scaleX(0.5);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 12px var(--bs-primary), 0 0 24px var(--bs-info);
            transform: scaleX(1.1);
          }
          100% {
            opacity: 1;
            box-shadow: 0 0 6px var(--bs-primary), 0 0 14px var(--bs-info);
            transform: scaleX(1);
          }
        }
      `}</style>

      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
          <Toast.Header>
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <Alert variant="danger">{error}</Alert>
        </div>
      ) : userData ? (
        <Container fluid className="flex-grow-1 d-flex flex-column px-0">
          <div className="sticky-top pt-3 px-3" style={{ zIndex: 1030 }}>
            <Navbar
              expand="lg"
              variant="light"
              className="shadow-sm mx-auto px-3 bg-white bg-opacity-75 backdrop-blur rounded-4 border border-light-subtle"
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
                    className="mx-auto my-2 my-lg-0 p-1 bg-secondary-subtle rounded-3"
                    style={{ gap: 2 }}
                  >
                    {usertype === 'ADVERTISER' && (
                      <Nav.Link
                        active={activeTab === "ads"}
                        onClick={() => setActiveTab("ads")}
                        className="d-flex align-items-center px-3 py-2 rounded-2"
                        style={activeTab === "ads"
                          ? { backgroundColor: '#fff', color: '#534AB7', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
                          : { color: '#64748B' }}
                      >
                        <BsMegaphone className="me-2" size={14} /> Advertisements
                      </Nav.Link>
                    )}
                    {usertype === 'ADVERTISER' && (
                      <Nav.Link
                        active={activeTab === "stats"}
                        onClick={() => {
                          setSelectedAdForStats(null);
                          setActiveTab("stats");
                        }}
                        className="d-flex align-items-center px-3 py-2 rounded-2"
                        style={activeTab === "stats"
                          ? { backgroundColor: '#fff', color: '#534AB7', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
                          : { color: '#64748B' }}
                      >
                        <BsBarChart className="me-2" size={14} /> Statistics
                      </Nav.Link>
                    )}
                    {usertype === 'DEVELOPER' && (
                      <Nav.Link
                        active={activeTab === "apps"}
                        onClick={() => setActiveTab("apps")}
                        className="d-flex align-items-center px-3 py-2 rounded-2"
                        style={activeTab === "apps"
                          ? { backgroundColor: '#fff', color: '#534AB7', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
                          : { color: '#64748B' }}
                      >
                        <BsGrid className="me-2" size={14} /> My Apps
                      </Nav.Link>
                    )}
                  </Nav>
                  <Nav className="ms-auto d-flex align-items-center gap-3">
                    {usertype === 'ADVERTISER' && (
                      <Button
                        size="sm"
                        className="d-flex align-items-center fw-semibold text-white border-0 rounded-2"
                        style={{ backgroundColor: '#F59E0B' }}
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
                        className="btn p-0 border-0 d-flex align-items-center justify-content-center shadow-none"
                      >
                        <span
                          title={userData.username}
                          className="d-flex align-items-center justify-content-center fw-semibold rounded-circle"
                          style={{
                            width: 36,
                            height: 36,
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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold mb-0 text-dark">Your Advertisements</h4>
                </div>

                {/* Search Bar + Integrated Pill Filters + Sort Container */}
                <div className="p-3 mb-4 rounded-3 border bg-white d-flex flex-wrap gap-3 align-items-center shadow-sm border-light-subtle">
                  {/* Search Bar */}
                  <div className="position-relative flex-grow-1" style={{ minWidth: 260, maxWidth: 360 }}>
                    <BsSearch
                      className="position-absolute top-50 translate-middle-y text-secondary"
                      style={{ left: 12 }}
                    />
                    <Form.Control
                      type="text"
                      placeholder="Search ads by title or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-5 rounded-2 shadow-none border-secondary-subtle"
                    />
                  </div>

                  {/* Pill Metric Filters (Inline) */}
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    {/* Ads Card */}
                    <div className="position-relative d-inline-block overflow-hidden rounded-pill">
                      {statusFilter === "all" && (
                        <div
                          key={`asteroid-all-${statusFilter}`}
                          className="position-absolute bottom-0 rounded-pill pointer-event-none bg-primary"
                          style={{
                            left: 0,
                            height: '3px',
                            width: '45%',
                            animation: 'asteroidPulseOnce 0.35s ease-out 1, asteroidSweep 1.2s cubic-bezier(0.25, 1, 0.5, 1) infinite',
                            zIndex: 1
                          }}
                        />
                      )}
                      <Card
                        role="button"
                        onClick={() => setStatusFilter("all")}
                        className={`border-0 shadow-sm rounded-pill position-relative ${
                          statusFilter === "all" ? "bg-secondary-subtle" : "bg-white"
                        }`}
                        style={{
                          outline: statusFilter === "all" ? '2px solid #534AB7' : '1px solid #E2E8F0',
                          transform: statusFilter === "all" ? 'scale(1.03)' : 'scale(1)',
                          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      >
                        <Card.Body className="py-1 px-3 d-flex align-items-center gap-2">
                          <span className="text-secondary small fw-medium text-nowrap">Ads</span>
                          <span className="fw-bold">{totalAdsCount}</span>
                        </Card.Body>
                      </Card>
                    </div>

                    {/* Active Ads Card */}
                    <div className="position-relative d-inline-block overflow-hidden rounded-pill">
                      {statusFilter === "active" && (
                        <div
                          key={`asteroid-active-${statusFilter}`}
                          className="position-absolute bottom-0 rounded-pill pointer-event-none bg-success"
                          style={{
                            left: 0,
                            height: '3px',
                            width: '45%',
                            animation: 'asteroidPulseOnce 0.35s ease-out 1, asteroidSweep 1.2s cubic-bezier(0.25, 1, 0.5, 1) infinite',
                            zIndex: 1
                          }}
                        />
                      )}
                      <Card
                        role="button"
                        onClick={() => setStatusFilter("active")}
                        className={`border-0 shadow-sm rounded-pill position-relative ${
                          statusFilter === "active" ? "bg-success-subtle" : "bg-white"
                        }`}
                        style={{
                          outline: statusFilter === "active" ? '2px solid #2E7D32' : '1px solid #E2E8F0',
                          transform: statusFilter === "active" ? 'scale(1.03)' : 'scale(1)',
                          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      >
                        <Card.Body className="py-1 px-3 d-flex align-items-center gap-2">
                          <span className="text-secondary small fw-medium text-nowrap">Active Ads</span>
                          <span className="fw-bold text-success">{activeAdsCount}</span>
                        </Card.Body>
                      </Card>
                    </div>

                    {/* Inactive Ads Card */}
                    <div className="position-relative d-inline-block overflow-hidden rounded-pill">
                      {statusFilter === "inactive" && (
                        <div
                          key={`asteroid-inactive-${statusFilter}`}
                          className="position-absolute bottom-0 rounded-pill pointer-event-none bg-secondary"
                          style={{
                            left: 0,
                            height: '3px',
                            width: '45%',
                            animation: 'asteroidPulseOnce 0.35s ease-out 1, asteroidSweep 1.2s cubic-bezier(0.25, 1, 0.5, 1) infinite',
                            zIndex: 1
                          }}
                        />
                      )}
                      <Card
                        role="button"
                        onClick={() => setStatusFilter("inactive")}
                        className={`border-0 shadow-sm rounded-pill position-relative ${
                          statusFilter === "inactive" ? "bg-light" : "bg-white"
                        }`}
                        style={{
                          outline: statusFilter === "inactive" ? '2px solid #64748B' : '1px solid #E2E8F0',
                          transform: statusFilter === "inactive" ? 'scale(1.03)' : 'scale(1)',
                          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      >
                        <Card.Body className="py-1 px-3 d-flex align-items-center gap-2">
                          <span className="text-secondary small fw-medium text-nowrap">Inactive Ads</span>
                          <span className="fw-bold text-secondary">{inactiveAdsCount}</span>
                        </Card.Body>
                      </Card>
                    </div>

                    {/* Expired Ads Card */}
                    <div className="position-relative d-inline-block overflow-hidden rounded-pill">
                      {statusFilter === "expired" && (
                        <div
                          key={`asteroid-expired-${statusFilter}`}
                          className="position-absolute bottom-0 rounded-pill pointer-event-none bg-danger"
                          style={{
                            left: 0,
                            height: '3px',
                            width: '45%',
                            animation: 'asteroidPulseOnce 0.35s ease-out 1, asteroidSweep 1.2s cubic-bezier(0.25, 1, 0.5, 1) infinite',
                            zIndex: 1
                          }}
                        />
                      )}
                      <Card
                        role="button"
                        onClick={() => setStatusFilter("expired")}
                        className={`border-0 shadow-sm rounded-pill position-relative ${
                          statusFilter === "expired" ? "bg-danger-subtle" : "bg-white"
                        }`}
                        style={{
                          outline: statusFilter === "expired" ? '2px solid #C62828' : '1px solid #E2E8F0',
                          transform: statusFilter === "expired" ? 'scale(1.03)' : 'scale(1)',
                          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                      >
                        <Card.Body className="py-1 px-3 d-flex align-items-center gap-2">
                          <span className="text-secondary small fw-medium text-nowrap">Expired Ads</span>
                          <span className="fw-bold text-danger">{expiredAdsCount}</span>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>

                  {/* Sort Dropdown */}
                  <Dropdown className="ms-auto">
                    <Dropdown.Toggle
                      size="sm"
                      variant="outline-secondary"
                      className="d-flex align-items-center rounded-2 border-secondary-subtle"
                    >
                      <BsSortDown className="me-2" /> {sortLabels[sortBy]}
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" className="shadow border-light-subtle rounded-3">
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
                    <>
                      <Row xs={1} md={2} lg={3} className="g-4">
                        {currentAds.map(ad => (
                          <Col key={ad.id}>
                            <Card className="h-100 bg-white border-0 shadow-sm rounded-3">
                              {/* Dynamic Badge */}
                              <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 10 }}>
                                {(Number(ad.is_expired) === 1 || ad.status === 'expired') ? (
                                  <Badge pill bg="danger" className="px-3 py-2">EXPIRED</Badge>
                                ) : Number(ad.isactive) === 1 ? (
                                  <Badge pill bg="success" className="px-3 py-2">✓ Active</Badge>
                                ) : (
                                  <Badge pill bg="secondary" className="px-3 py-2">Inactive</Badge>
                                )}
                              </div>

                              {/* Ad Image Container */}
                              <div className="position-relative overflow-hidden">
                                <img src={ad.ad_url} alt={ad.title} className="card-img-top object-fit-cover" style={{ height: '180px' }} />

                                <div className="p-3 bg-white bg-opacity-75 backdrop-blur border-top">
                                  <h5 className="fw-bold mb-1 text-dark">{ad.title}</h5>
                                  <p className="text-secondary small mb-2 text-truncate">
                                    {ad.description}
                                  </p>

                                  <div className="d-flex gap-3 pt-1 border-top border-secondary-subtle">
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
                              <Card.Footer className="bg-white border-0 p-3 rounded-bottom-3">
                                {(Number(ad.is_expired) === 1 || ad.status === 'expired') ? (
                                  <Button
                                    variant="outline-dark"
                                    size="sm"
                                    className="w-100 fw-semibold rounded-2 py-2"
                                    onClick={() => {
                                      setSelectedExpiredAd(ad);
                                      setShowExpiredAuditModal(false);
                                    }}
                                  >
                                    Full History Details
                                  </Button>
                                ) : (
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex gap-2">
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        id={ad.id}
                                        onClick={handleEditButton}
                                        className="d-flex align-items-center rounded-2 px-3"
                                      >
                                        <BsPencil className="me-1" /> Edit
                                      </Button>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleDetailsButton(ad.id)}
                                        className="d-flex align-items-center rounded-2 px-3"
                                      >
                                        <BsBarChart className="me-1" /> Analytics
                                      </Button>
                                    </div>

                                    {Number(ad.isactive) !== 1 && (
                                      <Button
                                        variant="success"
                                        size="sm"
                                        id={ad.id}
                                        onClick={handleActivateButton}
                                        className="rounded-2 px-3 fw-medium"
                                      >
                                        Activate
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </Card.Footer>
                            </Card>
                          </Col>
                        ))}
                      </Row>

                      {/* Style 1: Fully Rounded Standard Pagination Container */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center mt-5 mb-3">
                          <div
                            className="d-inline-flex align-items-center p-2 rounded-pill bg-white shadow-sm border border-light-subtle"
                            style={{ gap: '6px' }}
                          >
                            {/* Previous Button */}
                            <Button
                              variant="light"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                              className="rounded-circle d-flex align-items-center justify-content-center p-0 border-0"
                              style={{
                                width: 40,
                                height: 40,
                                backgroundColor: currentPage === 1 ? '#f1f5f9' : '#0284c7',
                                color: currentPage === 1 ? '#94a3b8' : '#ffffff',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <BsChevronLeft size={16} />
                            </Button>

                            {/* Page Numbers */}
                            {getPaginationRange().map((page, idx) => {
                              if (page === "...") {
                                return (
                                  <span
                                    key={`ellipsis-${idx}`}
                                    className="text-muted fw-bold px-2 d-flex align-items-center justify-content-center"
                                    style={{ width: 32, userSelect: 'none' }}
                                  >
                                    ...
                                  </span>
                                );
                              }

                              const isSelected = page === currentPage;
                              return (
                                <Button
                                  key={`page-${page}`}
                                  onClick={() => setCurrentPage(page)}
                                  className="rounded-circle fw-bold d-flex align-items-center justify-content-center p-0 border-0"
                                  style={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: isSelected ? '#2563eb' : 'transparent',
                                    color: isSelected ? '#ffffff' : '#334155',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {page}
                                </Button>
                              );
                            })}

                            {/* Next Button */}
                            <Button
                              variant="light"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                              className="rounded-circle d-flex align-items-center justify-content-center p-0 border-0"
                              style={{
                                width: 40,
                                height: 40,
                                backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#0284c7',
                                color: currentPage === totalPages ? '#94a3b8' : '#ffffff',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <BsChevronRight size={16} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Card className="text-center p-5 shadow-sm border-0 rounded-3">
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
                  <Card className="text-center p-5 shadow-sm border-0 rounded-3">
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

            {/* Statistics Component */}
            {activeTab === "stats" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="fw-bold text-dark">Your Ad Statistics</h4>
                  {selectedAdForStats && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setSelectedAdForStats(null)}
                    >
                      Clear Selection (Show All)
                    </Button>
                  )}
                </div>
                <Statistics adsData={stats} selectedAdId={selectedAdForStats} loading={statsLoading} error={statsError} />
              </>
            )}

            {activeTab === "profile" && (
              <>
                <h4 className="mb-4 fw-bold text-dark">Your Profile</h4>
                <Profile user={user} userData={userData} onUpdate={fetchData} />
              </>
            )}

            {activeTab === "apps" && (
              <>
                <h4 className="mb-4 fw-bold text-dark">My Publisher Apps</h4>
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

      {/* 1. Expired Campaign Audit Modal */}
      {selectedExpiredAd && (
        <div className={`modal fade ${showExpiredAuditModal ? 'show d-block' : 'd-none'}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 p-3 border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="fw-bold">Expired Campaign Audit: {selectedExpiredAd.title} (ID: #{selectedExpiredAd.id || 'AD1045'})</h5>
                <button type="button" className="btn-close" onClick={() => setShowExpiredAuditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="p-3 mb-3 bg-light rounded-3">
                  <span className="text-muted small fw-semibold d-block mb-2">Cumulative Lifetime Metrics</span>
                  <Row className="text-center g-2">
                    <Col><div className="bg-white p-2 rounded shadow-sm"><strong>Total Views</strong><div className="fs-5 fw-bold text-primary">15,230</div></div></Col>
                    <Col><div className="bg-white p-2 rounded shadow-sm"><strong>Clicks</strong><div className="fs-5 fw-bold">1,115</div></div></Col>
                    <Col><div className="bg-white p-2 rounded shadow-sm"><strong>CTR</strong><div className="fs-5 fw-bold text-success">7.32%</div></div></Col>
                    <Col><div className="bg-white p-2 rounded shadow-sm"><strong>Leads</strong><div className="fs-5 fw-bold">88</div></div></Col>
                    <Col><div className="bg-white p-2 rounded shadow-sm"><strong>Net Profit</strong><div className="fs-5 fw-bold text-success">$412.50</div></div></Col>
                  </Row>
                </div>

                <Row className="g-3 align-items-center">
                  <Col md={7}>
                    <div className="border p-3 rounded-3 bg-white">
                      <span className="small text-muted fw-semibold">Performance Over Time (Clicks)</span>
                      <div className="text-center py-4 text-muted border border-dashed rounded mt-2" style={{ height: 140 }}>
                        [Line Chart: Views vs Clicks Trend Graph]
                      </div>
                    </div>
                  </Col>
                  <Col md={5}>
                    <div className="border p-3 rounded-3 bg-white">
                      <span className="small text-muted fw-semibold">Read-only preview</span>
                      <img src={selectedExpiredAd.ad_url} alt="" className="w-100 rounded mt-2" style={{ height: 90, objectFit: 'cover' }} />
                      <p className="small text-muted mt-2 mb-0">{selectedExpiredAd.description}</p>
                    </div>
                  </Col>
                </Row>
              </div>
              <div className="modal-footer border-0 pt-0">
                <Button
                  variant="success"
                  className="w-100 py-2 fw-semibold border-0"
                  onClick={() => {
                    setShowExpiredAuditModal(false);
                    setReLaunchForm({
                      title: selectedExpiredAd.title,
                      description: selectedExpiredAd.description,
                      targetUrl: selectedExpiredAd.target_url || "coffee-promo.local/deals",
                      mediaUrl: selectedExpiredAd.ad_url,
                      startDate: "",
                      endDate: "",
                      budget: "",
                      isEditingCreative: false
                    });
                    setShowReLaunchModal(true);
                  }}
                >
                  Re-Launch This Ad
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Re-Launch New Version Modal */}
      <div className={`modal fade ${showReLaunchModal ? 'show d-block' : 'd-none'}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 p-3 border-0">
            <div className="modal-header border-0 pb-0">
              <h5 className="fw-bold">Re-Launch: {reLaunchForm.title} (New Version)</h5>
              <button type="button" className="btn-close" onClick={() => setShowReLaunchModal(false)}></button>
            </div>
            <div className="modal-body">
              <Form>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="small fw-semibold mb-0">Campaign Title</Form.Label>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="py-0 px-2"
                    style={{ fontSize: 11 }}
                    onClick={() => setReLaunchForm(prev => ({ ...prev, isEditingCreative: !prev.isEditingCreative }))}
                  >
                    Edit Ad Copy & Creative
                  </Button>
                </div>
                <Form.Control
                  type="text"
                  value={reLaunchForm.title}
                  disabled={!reLaunchForm.isEditingCreative}
                  onChange={(e) => setReLaunchForm({ ...reLaunchForm, title: e.target.value })}
                  className="mb-3"
                />

                <Form.Label className="small fw-semibold">Ad Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={reLaunchForm.description}
                  disabled={!reLaunchForm.isEditingCreative}
                  onChange={(e) => setReLaunchForm({ ...reLaunchForm, description: e.target.value })}
                  className="mb-3"
                />

                <Form.Label className="small fw-semibold">Target URL</Form.Label>
                <Form.Control
                  type="text"
                  value={reLaunchForm.targetUrl}
                  disabled={!reLaunchForm.isEditingCreative}
                  onChange={(e) => setReLaunchForm({ ...reLaunchForm, targetUrl: e.target.value })}
                  className="mb-3"
                />

                <Form.Label className="small fw-semibold">New Run Dates (Duration)</Form.Label>
                <Row className="g-2 mb-3">
                  <Col>
                    <Form.Control
                      type="date"
                      placeholder="Start Date"
                      value={reLaunchForm.startDate}
                      onChange={(e) => setReLaunchForm({ ...reLaunchForm, startDate: e.target.value })}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="date"
                      placeholder="End Date"
                      value={reLaunchForm.endDate}
                      onChange={(e) => setReLaunchForm({ ...reLaunchForm, endDate: e.target.value })}
                    />
                  </Col>
                </Row>

                <Form.Label className="small fw-semibold">New Budget Allocation</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter budget (e.g., $500)"
                  value={reLaunchForm.budget}
                  onChange={(e) => setReLaunchForm({ ...reLaunchForm, budget: e.target.value })}
                  className="mb-2"
                />
                <span className="text-muted" style={{ fontSize: 11 }}>Parent Ad: #{selectedExpiredAd?.id || 'AD1045'} (Frozen History)</span>
              </Form>
            </div>
            <div className="modal-footer border-0 pt-0">
              <Button
                variant="success"
                className="w-100 py-2 fw-semibold border-0"
                onClick={() => {
                  setShowReLaunchModal(false);
                  setToastMessage("New campaign version successfully launched!");
                  setShowToast(true);
                  fetchData();
                }}
              >
                Launch New Version
              </Button>
            </div>
          </div>
        </div>
      </div>

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