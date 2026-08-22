import React from "react";
import { Card, Dropdown } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#0088FE", "#FFBB28", "#00C49F", "#FF8042"];

const LOCATION_LABELS = {
  pincode: "Pincode",
  city: "City",
  district: "District",
  state: "State",
  country: "Country",
};

const LocationPieChart = ({
  type = "views",
  data = [],
  locationFilter,
  setLocationFilter,
  locationMetric,
  setLocationMetric,
}) => {
  const isViews = type === "views";

  const subtitle = isViews
    ? "Audience distribution by location"
    : "Engagement distribution by location";

  const icon = isViews ? "bi-eye-fill" : "bi-cursor-fill";
  const badgeIcon = isViews ? "bi-geo-alt-fill" : "bi-activity";
  const color = isViews ? "primary" : "success";

  const metricLabels = isViews
    ? {
        views: "Views",
        uniqueViews: "Unique Views",
      }
    : {
        clicks: "Clicks",
        uniqueClicks: "Unique Clicks",
      };

  const total = data.reduce((sum, item) => {
    return sum + (Number(item[locationMetric]) || 0);
  }, 0);

  return (
    <Card className="statistics-card border-0 shadow-sm h-100">
      <Card.Body className="p-4">

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-3">

            <div className={`bg-${color} bg-opacity-10 text-${color} rounded-circle p-3`}>
              <i className={`bi ${icon} fs-4`}></i>
            </div>

            <div>
              <h5 className="fw-bold mb-0">{metricLabels[locationMetric]} by Region</h5>
              <small className="text-muted">{subtitle}</small>
            </div>

          </div>

          <span className={`badge rounded-pill text-bg-${color} px-3 py-2`}>
            <i className={`bi ${badgeIcon} me-1`}></i>
            {isViews ? "Analytics" : "Engagement"}
          </span>
        </div>

        <div className="border rounded-3 bg-light p-2 d-flex gap-2 mb-3">

          <Dropdown>
            <Dropdown.Toggle variant="light" size="sm" className="border-0 fw-semibold">
              <i className={`bi bi-geo-alt text-${color} me-2`}></i>
              {LOCATION_LABELS[locationFilter]}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                <Dropdown.Item key={value} active={locationFilter === value} onClick={() => setLocationFilter(value)}>
                  By {label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown>
            <Dropdown.Toggle variant="light" size="sm" className="border-0 fw-semibold">
              <i className={`bi bi-bar-chart text-${color} me-2`}></i>
              {metricLabels[locationMetric]}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {Object.entries(metricLabels).map(([value, label]) => (
                <Dropdown.Item key={value} active={locationMetric === value} onClick={() => setLocationMetric(value)}>
                  {label}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

        </div>

        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>

              <Pie data={data} dataKey={locationMetric} nameKey="name" cx="50%" cy="45%" innerRadius={85} outerRadius={130} paddingAngle={4} cornerRadius={10}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <text x="50%" y="40%" textAnchor="middle" className="text-muted">
                Total
              </text>

              <text x="50%" y="48%" textAnchor="middle" className="fw-bold">
                {total.toLocaleString()}
              </text>

              <Tooltip />
              <Legend iconType="circle" verticalAlign="bottom" />

            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: 360 }}>
            <i className="bi bi-geo-alt fs-1 mb-3"></i>
            <span>
              No {LOCATION_LABELS[locationFilter].toLowerCase()} {isViews ? "view" : "click"} data available
            </span>
          </div>
        )}

      </Card.Body>
    </Card>
  );
};

export default LocationPieChart;