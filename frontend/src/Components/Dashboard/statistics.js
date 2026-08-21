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
          <Card className="statistics-card p-3">
            <h5 className="mb-3">Views vs Clicks</h5>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: "Total", views: selectedAd.total_views, clicks: selectedAd.total_clicks },
                { name: "Unique", views: selectedAd.unique_views, clicks: selectedAd.unique_clicks }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#8884d8" />
                <Bar dataKey="clicks" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 📊 Views by Region */}
      <Row className="mb-5">
        <Col md={6}>
          <Card className="statistics-card p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">{metricLabels[locationMetric]} by Region</h5>
              <div className="d-flex gap-2">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" size="sm">
                    By {locationLabels[locationFilter]}
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
                  <Dropdown.Toggle variant="outline-primary" size="sm">
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
            </div>

            {viewsByLocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={viewsByLocationData}
                    dataKey={locationMetric}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {viewsByLocationData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="d-flex align-items-center justify-content-center text-muted"
                style={{ height: 350 }}
              >
                No {locationLabels[locationFilter].toLowerCase()} view data available
              </div>
            )}
          </Card>
        </Col>
        <Col md={6}>
          <Card className="statistics-card p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                {clickMetricLabels[clickLocationMetric] === "Clicks" ? "Clicks" : "Unique Clicks"} by Region
              </h5>
              <div className="d-flex gap-2">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" size="sm">
                    By {locationLabels[clickLocationFilter]}
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
                  <Dropdown.Toggle variant="outline-primary" size="sm">
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
            </div>

            {clicksByLocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={clicksByLocationData}
                    dataKey={clickLocationMetric}
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label
                  >
                    {clicksByLocationData.map((entry, index) => (
                      <Cell
                        key={`click-cell-${entry.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="d-flex align-items-center justify-content-center text-muted"
                style={{ height: 350 }}
              >
                No {locationLabels[clickLocationFilter].toLowerCase()} click data available
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 📈 MongoDB event trend */}
      <Row>
        <Col>
          <Card className="statistics-card p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">{trendPeriod[0].toUpperCase() + trendPeriod.slice(1)} Trend (Views & Clicks)</h5>
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary" size="sm">
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
            {chartTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#8884d8" />
                  <Line type="monotone" dataKey="clicks" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 300 }}>
                No {trendPeriod} trend data available
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;