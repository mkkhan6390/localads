import React, { useState, useEffect } from "react";
import { Row, Col, Card, Dropdown } from "react-bootstrap";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#0088FE", "#FFBB28", "#00C49F", "#FF8042"];

const normalizeDayTrendData = (dateMap = {}) => {
  const result = [];

  if (!dateMap) return result;

  Object.values(dateMap).forEach((yearData) => {
    Object.values(yearData || {}).forEach((monthData) => {
      Object.values(monthData || {}).forEach((weekData) => {
        Object.values(weekData || {}).forEach((dayData) => {
          if (!dayData) return;

          const views = Number(dayData.views || dayData.viewss || 0);
          const clicks = Number(dayData.clicks || dayData.clickss || 0);

          if (views > 0 || clicks > 0) {
            result.push({
              day: dayData.day || "Unknown",
              views,
              clicks
            });
          }
        });
      });
    });
  });
  return result;
};

const Statistics = ({ adsData = [] }) => {
  const [selectedAd, setSelectedAd] = useState(null);
  const [locationFilter, setLocationFilter] = useState("pincode");
  const [locationMetric, setLocationMetric] = useState("views");
  const [clickLocationFilter, setClickLocationFilter] = useState("pincode");
  const [clickLocationMetric, setClickLocationMetric] = useState("clicks");
  const [trendPeriod, setTrendPeriod] = useState("daily");

  useEffect(() => {
    if (!adsData || adsData.length === 0) {
      setSelectedAd(null);
      return;
    }

    setSelectedAd((prevSelectedAd) => {
      if (!prevSelectedAd) return adsData[0];

      const matchingAd = adsData.find(
        (ad) => (ad.id || ad.adid) === (prevSelectedAd.id || prevSelectedAd.adid)
      );

      return matchingAd || adsData[0];
    });
  }, [adsData]);

  if (!selectedAd) return <p>No statistics available</p>;

  // ✅ Day trend
  const fallbackTrendData = normalizeDayTrendData(selectedAd.datetimes);
  const trendData = selectedAd.trendData?.[trendPeriod] || fallbackTrendData;
  const chartTrendData = trendData.map((entry) => ({
    ...entry,
    label: entry.label || entry.period || entry.day || "Unknown"
  }));
  const viewsByLocationData = (selectedAd.viewsByLocation?.[locationFilter] || []).map((entry) => ({
    ...entry,
    name: locationFilter === "pincode" ? entry.pincode : entry.name,
    uniqueViews: Number(entry.uniqueViews ?? entry.unique_views) || 0
  }));
  const clicksByLocationData = (selectedAd.clicksByLocation?.[clickLocationFilter] || []).map((entry) => ({
    ...entry,
    name: clickLocationFilter === "pincode" ? entry.pincode : entry.name,
    uniqueClicks: Number(entry.uniqueClicks ?? entry.unique_clicks) || 0
  }));
  const locationLabels = {
    pincode: "Pincode",
    city: "City",
    district: "District",
    state: "State",
    country: "Country"
  };
  const metricLabels = {
    views: "Views",
    uniqueViews: "Unique Views"
  };
  const clickMetricLabels = {
    clicks: "Clicks",
    uniqueClicks: "Unique Clicks"
  };

  return (
    <div className="statistics-page">
      {/* 🔽 Dropdown Selector */}
      <Row className="mb-4">
        <Col>
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" className="shadow-sm rounded-pill px-4">
              {selectedAd.title || `Ad #${selectedAd.id || selectedAd.adid}`}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {adsData.map(ad => (
                <Dropdown.Item
                  key={ad.id || ad.adid}
                  onClick={() => setSelectedAd(ad)}
                  active={(ad.id || ad.adid) === (selectedAd.id || selectedAd.adid)}
                >
                  {ad.title || `Ad #${ad.id || ad.adid}`}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* 📊 Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="metric-card text-center p-3">
            <h6>Total Views</h6>
            <h4>{selectedAd.total_views}</h4>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card text-center p-3">
            <h6>Unique Views</h6>
            <h4>{selectedAd.unique_views}</h4>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card text-center p-3">
            <h6>Total Clicks</h6>
            <h4>{selectedAd.total_clicks}</h4>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="metric-card text-center p-3">
            <h6>Unique Clicks</h6>
            <h4>{selectedAd.unique_clicks}</h4>
          </Card>
        </Col>
      </Row>

      {/* 📊 Views vs Clicks */}
      <Row className="mb-5">
        <Col>
          <Card className="statistics-card shadow-sm border-0 p-4">

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-1">Performance Overview</h5>
                <p className="text-muted small mb-0">
                  Compare total and unique views with clicks
                </p>
              </div>

              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2">
                Ad Analytics
              </span>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={[
                  { name: "Total", views: Number(selectedAd.total_views) || 0, clicks: Number(selectedAd.total_clicks) || 0 },
                  { name: "Unique", views: Number(selectedAd.unique_views) || 0, clicks: Number(selectedAd.unique_clicks) || 0 },
                ]}
                barGap={10}
                barCategoryGap="35%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Bar dataKey="views" name="Views" fill="#0d6efd" radius={[8, 8, 0, 0]} maxBarSize={70} />
                <Bar dataKey="clicks" name="Clicks" fill="#20c997" radius={[8, 8, 0, 0]} maxBarSize={70} />
              </BarChart>
            </ResponsiveContainer>

          </Card>
        </Col>
      </Row>

      {/* 📊 Views & Clicks by Region */}
      <Row className="mb-5 g-4">

        {/* 👁 Views by Region */}
        <Col lg={6}>
          <Card className="statistics-card border-0 shadow-sm h-100">
            <Card.Body className="p-4">

              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-3">
                    <i className="bi bi-eye-fill fs-4"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-0">
                      {metricLabels[locationMetric]} by Region
                    </h5>

                    <small className="text-muted">
                      Audience distribution by location
                    </small>
                  </div>
                </div>

                <span className="badge rounded-pill text-bg-primary px-3 py-2">
                  <i className="bi bi-geo-alt-fill me-1"></i>
                  Analytics
                </span>
              </div>

              {/* Filters */}
              <div className="border rounded-3 bg-light p-2 d-flex gap-2 mb-3">
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" className="border-0 fw-semibold">
                    <i className="bi bi-geo-alt text-primary me-2"></i>
                    {locationLabels[locationFilter]}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {Object.entries(locationLabels).map(([value, label]) => (
                      <Dropdown.Item
                        key={value}
                        active={locationFilter === value}
                        onClick={() => setLocationFilter(value)}
                      >
                        By {label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" className="border-0 fw-semibold">
                    <i className="bi bi-bar-chart text-primary me-2"></i>
                    {metricLabels[locationMetric]}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {Object.entries(metricLabels).map(([value, label]) => (
                      <Dropdown.Item
                        key={value}
                        active={locationMetric === value}
                        onClick={() => setLocationMetric(value)}
                      >
                        {label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Chart */}
              {viewsByLocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>

                    <Pie
                      data={viewsByLocationData}
                      dataKey={locationMetric}
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={85}
                      outerRadius={130}
                      paddingAngle={4}
                      cornerRadius={10}
                    >
                      {viewsByLocationData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    {/* Center Total */}
                    <text x="50%" y="40%" textAnchor="middle" className="text-muted">
                      Total
                    </text>

                    <text x="50%" y="48%" textAnchor="middle" className="fw-bold">
                      {viewsByLocationData
                        .reduce((total, item) => total + (Number(item[locationMetric]) || 0), 0)
                        .toLocaleString()}
                    </text>

                    <Tooltip />

                    <Legend
                      iconType="circle"
                      verticalAlign="bottom"
                    />

                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: 360 }}>
                  <i className="bi bi-geo-alt fs-1 mb-3"></i>
                  <span>
                    No {locationLabels[locationFilter].toLowerCase()} view data available
                  </span>
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>


        {/* 🖱 Clicks by Region */}
        <Col lg={6}>
          <Card className="statistics-card border-0 shadow-sm h-100">
            <Card.Body className="p-4">

              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle p-3">
                    <i className="bi bi-cursor-fill fs-4"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-0">
                      {clickMetricLabels[clickLocationMetric]} by Region
                    </h5>

                    <small className="text-muted">
                      Engagement distribution by location
                    </small>
                  </div>
                </div>

                <span className="badge rounded-pill text-bg-success px-3 py-2">
                  <i className="bi bi-activity me-1"></i>
                  Engagement
                </span>
              </div>

              {/* Filters */}
              <div className="border rounded-3 bg-light p-2 d-flex gap-2 mb-3">
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" className="border-0 fw-semibold">
                    <i className="bi bi-geo-alt text-success me-2"></i>
                    {locationLabels[clickLocationFilter]}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {Object.entries(locationLabels).map(([value, label]) => (
                      <Dropdown.Item
                        key={value}
                        active={clickLocationFilter === value}
                        onClick={() => setClickLocationFilter(value)}
                      >
                        By {label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" className="border-0 fw-semibold">
                    <i className="bi bi-bar-chart text-success me-2"></i>
                    {clickMetricLabels[clickLocationMetric]}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {Object.entries(clickMetricLabels).map(([value, label]) => (
                      <Dropdown.Item
                        key={value}
                        active={clickLocationMetric === value}
                        onClick={() => setClickLocationMetric(value)}
                      >
                        {label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Chart */}
              {clicksByLocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>

                    <Pie
                      data={clicksByLocationData}
                      dataKey={clickLocationMetric}
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={85}
                      outerRadius={130}
                      paddingAngle={4}
                      cornerRadius={10}
                    >
                      {clicksByLocationData.map((entry, index) => (
                        <Cell
                          key={`click-cell-${entry.name}-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    {/* Center Total */}
                    <text x="50%" y="40%" textAnchor="middle" className="text-muted">
                      Total
                    </text>

                    <text x="50%" y="48%" textAnchor="middle" className="fw-bold">
                      {clicksByLocationData
                        .reduce((total, item) => total + (Number(item[clickLocationMetric]) || 0), 0)
                        .toLocaleString()}
                    </text>

                    <Tooltip />

                    <Legend
                      iconType="circle"
                      verticalAlign="bottom"
                    />

                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: 360 }}>
                  <i className="bi bi-geo-alt fs-1 mb-3"></i>
                  <span>
                    No {locationLabels[clickLocationFilter].toLowerCase()} click data available
                  </span>
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>

      </Row>

      {/* 📈 Views & Clicks Trend */}
      <Row className="mb-5">
        <Col>
          <Card className="statistics-card border-0 shadow-sm">
            <Card.Body className="p-4">

              {/* Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-info bg-opacity-10 text-info rounded-circle p-3">
                    <i className="bi bi-graph-up-arrow fs-4"></i>
                  </div>

                  <div>
                    <h5 className="fw-bold mb-0">
                      {trendPeriod[0].toUpperCase() + trendPeriod.slice(1)} Trend
                    </h5>

                    <small className="text-muted">
                      Track views and clicks performance over time
                    </small>
                  </div>
                </div>

                <span className="badge rounded-pill text-bg-info px-3 py-2">
                  <i className="bi bi-activity me-1"></i>
                  Performance
                </span>
              </div>

              {/* Filter */}
              <div className="border rounded-3 bg-light p-2 d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-calendar-range text-info ms-1"></i>

                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" className="border-0 fw-semibold">
                    {trendPeriod[0].toUpperCase() + trendPeriod.slice(1)}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {[
                      ["daily", "Daily"],
                      ["weekly", "Weekly"],
                      ["monthly", "Monthly"],
                      ["quarterly", "Quarterly"],
                      ["yearly", "Yearly"]
                    ].map(([value, label]) => (
                      <Dropdown.Item
                        key={value}
                        active={trendPeriod === value}
                        onClick={() => setTrendPeriod(value)}
                      >
                        {label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Chart */}
              {chartTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart
                    data={chartTrendData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip />

                    <Legend
                      iconType="circle"
                      verticalAlign="top"
                      align="right"
                    />

                    <Line
                      type="monotone"
                      dataKey="views"
                      name="Views"
                      stroke="#0d6efd"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 7 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="clicks"
                      name="Clicks"
                      stroke="#20c997"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: 360 }}>
                  <i className="bi bi-graph-up fs-1 mb-3 opacity-50"></i>

                  <span>
                    No {trendPeriod} trend data available
                  </span>
                </div>
              )}

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;