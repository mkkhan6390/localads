import React, { useState, useEffect } from "react";
import { Row, Col, Card, Dropdown, Alert } from "react-bootstrap";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#0088FE", "#FFBB28", "#00C49F", "#FF8042"];

const normalizeMetricData = (source = []) => {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source
      .filter(Boolean)
      .map((entry) => ({
        name: entry.name || entry.label || "Unknown",
        views: Number(entry.views || 0),
        clicks: Number(entry.clicks || 0)
      }))
      .filter((entry) => (entry.views || entry.clicks) > 0);
  }

  return Object.entries(source)
    .map(([key, stats]) => ({
      name: key,
      views: Number(stats?.views || 0),
      clicks: Number(stats?.clicks || 0)
    }))
    .filter((entry) => (entry.views || entry.clicks) > 0);
};

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

  // ✅ Region data
  const regionData = normalizeMetricData(selectedAd.regions);

  // ✅ App data
  const appData = normalizeMetricData(selectedAd.apps);

  // ✅ Day trend
  const dayTrendData = normalizeDayTrendData(selectedAd.datetimes);

  return (
    <div>
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
          <Card className="shadow-sm text-center p-3">
            <h6>Total Views</h6>
            <h4>{selectedAd.total_views}</h4>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm text-center p-3">
            <h6>Unique Views</h6>
            <h4>{selectedAd.unique_views}</h4>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm text-center p-3">
            <h6>Total Clicks</h6>
            <h4>{selectedAd.total_clicks}</h4>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm text-center p-3">
            <h6>Unique Clicks</h6>
            <h4>{selectedAd.unique_clicks}</h4>
          </Card>
        </Col>
      </Row>

      {/* 📊 Views vs Clicks */}
      <Row className="mb-5">
        <Col>
          <Card className="shadow-sm p-3">
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

      {/* 🥧 Regions & Apps Distribution */}
      <Row className="mb-5">
        <Col md={6}>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">Region Distribution (Views)</h5>
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={regionData} dataKey="views" nameKey="name" outerRadius={120} label>
                    {regionData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 300 }}>
                No region view data available
              </div>
            )}
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">App Distribution (Views)</h5>
            {appData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={appData} dataKey="views" nameKey="name" outerRadius={120} label>
                    {appData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 300 }}>
                No app view data available
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col md={6}>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">Region Distribution (Clicks)</h5>
            {regionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={regionData} dataKey="clicks" nameKey="name" outerRadius={120} label>
                    {regionData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 300 }}>
                No region click data available
              </div>
            )}
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">App Distribution (Clicks)</h5>
            {appData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={appData} dataKey="clicks" nameKey="name" outerRadius={120} label>
                    {appData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 300 }}>
                No app click data available
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 📈 Daily Trend */}
      <Row>
        <Col>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">Daily Trend (Views & Clicks)</h5>
            {dayTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dayTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#8884d8" />
                  <Line type="monotone" dataKey="clicks" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 300 }}>
                No daily trend data available
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;