import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const PerformanceOverviewChart = ({ selectedAd }) => {
  const data = [
    {
      name: "Total",
      views: Number(selectedAd?.total_views) || 0,
      clicks: Number(selectedAd?.total_clicks) || 0,
    },
    {
      name: "Unique",
      views: Number(selectedAd?.unique_views) || 0,
      clicks: Number(selectedAd?.unique_clicks) || 0,
    },
  ];

  return (
    <Row className="mb-5">
      <Col>
        <Card className="statistics-card shadow-sm border-0 p-4">

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="fw-bold mb-1">Performance Overview</h5>
              <p className="text-muted small mb-0">Compare total and unique views with clicks</p>
            </div>

            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2">
              Ad Analytics
            </span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} barGap={10} barCategoryGap="35%">
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
  );
};

export default PerformanceOverviewChart;