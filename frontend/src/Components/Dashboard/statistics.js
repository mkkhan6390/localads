import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Card, Dropdown, Alert, Spinner } from "react-bootstrap";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#0088FE", "#FFBB28", "#00C49F", "#FF8042"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Backend numbers can be missing (e.g. an ad with views but no clicks) -> always show 0, never blank.
const num = (v) => Number(v) || 0;

const adLabel = (ad) => ad.title || `Ad #${ad.adid}`;

// { name: {views, clicks} } -> [{ name, views, clicks }] (biggest first)
const toChartRows = (obj) =>
  Object.entries(obj || {})
    .map(([name, s]) => ({ name, views: num(s && s.views), clicks: num(s && s.clicks) }))
    .sort((a, b) => b.views + b.clicks - (a.views + a.clicks));

// year -> month -> weekN -> day  ==>  flat list sorted by date
const buildDayTrend = (datetimes) => {
  const rows = [];
  Object.entries(datetimes || {}).forEach(([year, months]) =>
    Object.entries(months || {}).forEach(([month, weeks]) =>
      Object.values(weeks || {}).forEach((days) =>
        Object.entries(days || {}).forEach(([dayOfMonth, d]) => {
          const date =
            d.date || `${year}-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`;
          rows.push({ date, views: num(d.views), clicks: num(d.clicks) });
        })
      )
    )
  );
  rows.sort((a, b) => a.date.localeCompare(b.date));

  const spansYears = new Set(rows.map((r) => r.date.slice(0, 4))).size > 1;
  return rows.map((r) => {
    const [y, m, d] = r.date.split("-");
    const label = `${Number(d)} ${MONTHS[Number(m) - 1] || m}${spansYears ? ` ${y.slice(-2)}` : ""}`;
    return { ...r, label };
  });
};

const NoData = () => <div className="text-center text-muted py-5">No data yet</div>;

const Statistics = ({ adsData, selectedAdId = null, loading = false, error = "" }) => {
  const ads = useMemo(() => (Array.isArray(adsData) ? adsData : []), [adsData]);

  // Which ad is shown. Starts from the ad whose "Analytics" button was clicked, if any.
  const [chosenId, setChosenId] = useState(selectedAdId != null ? String(selectedAdId) : null);

  useEffect(() => {
    setChosenId(selectedAdId != null ? String(selectedAdId) : null);
  }, [selectedAdId]);

  // Fall back to the first ad when nothing is chosen (or the chosen one no longer exists).
  const selectedAd = useMemo(
    () => ads.find((a) => String(a.adid) === chosenId) || ads[0] || null,
    [ads, chosenId]
  );

  if (ads.length === 0) {
    if (loading) {
      return (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }
    if (error) {
      return (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      );
    }
    return (
      <Alert variant="info" className="mt-3">
        No statistics available yet. Statistics will appear here once your ads start receiving views and clicks.
      </Alert>
    );
  }

  const totalViews = num(selectedAd.total_views);
  const totalClicks = num(selectedAd.total_clicks);
  const uniqueViews = num(selectedAd.unique_views);
  const uniqueClicks = num(selectedAd.unique_clicks);

  // ✅ Region data
  const regionData = toChartRows(selectedAd.regions);
  const regionViews = regionData.filter((r) => r.views > 0);
  const regionClicks = regionData.filter((r) => r.clicks > 0);

  // ✅ App data
  const appData = toChartRows(selectedAd.apps);
  const appViews = appData.filter((r) => r.views > 0);
  const appClicks = appData.filter((r) => r.clicks > 0);

  // ✅ Day trend
  const dayTrendData = buildDayTrend(selectedAd.datetimes);

  // Click rate and the last 7 days, worked out from data we already have.
  const clickRate = totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(2)}%` : "n/a";
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const last7Days = dayTrendData.filter((r) => r.date >= sevenDaysAgo);
  const views7d = last7Days.reduce((sum, r) => sum + r.views, 0);
  const clicks7d = last7Days.reduce((sum, r) => sum + r.clicks, 0);

  const renderPie = (title, data, dataKey) => (
    <Col md={6}>
      <Card className="shadow-sm p-3">
        <h5 className="mb-3">{title}</h5>
        {data.length === 0 ? (
          <NoData />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} dataKey={dataKey} nameKey="name" outerRadius={120} label>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>
    </Col>
  );

  return (
    <div>
      {error && (
        <Alert variant="warning" className="mt-0">
          {error}
        </Alert>
      )}

      {/* 🔽 Dropdown Selector */}
      <Row className="mb-4">
        <Col>
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" className="shadow-sm rounded-pill px-4">
              {adLabel(selectedAd)}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {ads.map((ad) => (
                <Dropdown.Item
                  key={ad.adid}
                  onClick={() => setChosenId(String(ad.adid))}
                  active={String(ad.adid) === String(selectedAd.adid)}
                >
                  {adLabel(ad)}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {totalViews + totalClicks === 0 && (
        <Alert variant="info">
          This ad hasn't received any views or clicks yet. Statistics will appear here as soon as it is
          shown in an app or website that uses your LocalAds SDK.
        </Alert>
      )}

      {/* 📊 Summary Cards */}
      <Row className="mb-4">
        <Col xs={6} md={3} className="mb-3 mb-md-0">
          <Card className="shadow-sm text-center p-3">
            <h6>Total Views</h6>
            <h4>{totalViews.toLocaleString()}</h4>
          </Card>
        </Col>
        <Col xs={6} md={3} className="mb-3 mb-md-0">
          <Card className="shadow-sm text-center p-3">
            <h6>Unique Views</h6>
            <h4>{uniqueViews.toLocaleString()}</h4>
          </Card>
        </Col>
        <Col xs={6} md={3} className="mb-3 mb-md-0">
          <Card className="shadow-sm text-center p-3">
            <h6>Total Clicks</h6>
            <h4>{totalClicks.toLocaleString()}</h4>
          </Card>
        </Col>
        <Col xs={6} md={3} className="mb-3 mb-md-0">
          <Card className="shadow-sm text-center p-3">
            <h6>Unique Clicks</h6>
            <h4>{uniqueClicks.toLocaleString()}</h4>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col xs={12} md={4} className="mb-3 mb-md-0">
          <Card className="shadow-sm text-center p-3">
            <h6>Click Rate</h6>
            <h4>{clickRate}</h4>
          </Card>
        </Col>
        <Col xs={12} md={4} className="mb-3 mb-md-0">
          <Card className="shadow-sm text-center p-3">
            <h6>Views (last 7 days)</h6>
            <h4>{views7d.toLocaleString()}</h4>
          </Card>
        </Col>
        <Col xs={12} md={4} className="mb-3 mb-md-0">
          <Card className="shadow-sm text-center p-3">
            <h6>Clicks (last 7 days)</h6>
            <h4>{clicks7d.toLocaleString()}</h4>
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
                { name: "Total", views: totalViews, clicks: totalClicks },
                { name: "Unique", views: uniqueViews, clicks: uniqueClicks }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
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
        {renderPie("Region Distribution (Views)", regionViews, "views")}
        {renderPie("App Distribution (Views)", appViews, "views")}
      </Row>

      <Row className="mb-5">
        {renderPie("Region Distribution (Clicks)", regionClicks, "clicks")}
        {renderPie("App Distribution (Clicks)", appClicks, "clicks")}
      </Row>

      {/* 📈 Daily Trend */}
      <Row>
        <Col>
          <Card className="shadow-sm p-3">
            <h5 className="mb-3">Daily Trend (Views & Clicks)</h5>
            {dayTrendData.length === 0 ? (
              <NoData />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dayTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#8884d8" />
                  <Line type="monotone" dataKey="clicks" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;