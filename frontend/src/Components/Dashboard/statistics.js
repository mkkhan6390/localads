import React, { useState } from "react";
import { Row, Col, Card, Dropdown } from "react-bootstrap";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#0088FE", "#FFBB28", "#00C49F", "#FF8042"];

const Statistics = ({ adsData }) => {
  const [selectedAd, setSelectedAd] = useState(adsData[0]);

  if (!selectedAd) return <p>No statistics available</p>;

  // ✅ Region data
  const regionData = Object.entries(selectedAd.regions || {}).map(([region, stats]) => ({
    name: region,
    views: stats.views,
    clicks: stats.clicks
  }));

  // ✅ App data
  const appData = Object.entries(selectedAd.apps || {}).map(([app, stats]) => ({
    appid: app,
    views: stats.views,
    clicks: stats.clicks
  }));

  // ✅ Day trend
  let dayTrendData = [];
  if (selectedAd.datetimes) {
    Object.values(selectedAd.datetimes).forEach(year =>
      Object.values(year).forEach(month =>
        Object.values(month).forEach(week =>
          Object.values(week).forEach(day => {
            dayTrendData.push({
              day: day.day,
              views: day.views,
              clicks: day.clicks
            });
          })
        )
      )
    );
  }

  return (
    <div>
      {/* 🔽 Dropdown Selector */}
      <Row className="mb-4">
        <Col>
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" className="shadow-sm rounded-pill px-4">
              {selectedAd.title || `Ad #${selectedAd.adid}`}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {adsData.map(ad => (
                <Dropdown.Item
                  key={ad.adid}
                  onClick={() => setSelectedAd(ad)}
                  active={ad.adid === selectedAd.id}
                >
                  {ad.title || `Ad #${ad.adid}`}
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
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">App Distribution (Views)</h5>
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
          </Card>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col md={6}>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">Region Distribution (Clicks)</h5>
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
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">App Distribution (Clicks)</h5>
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
          </Card>
        </Col>
      </Row>

      {/* 📈 Daily Trend */}
      <Row>
        <Col>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">Daily Trend (Views & Clicks)</h5>
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
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;