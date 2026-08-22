import React from "react";
import { Card, Dropdown, Row, Col } from "react-bootstrap";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TrendAreaChart = ({ data = [], trendPeriod, setTrendPeriod }) => {
  const periodLabel = trendPeriod[0].toUpperCase() + trendPeriod.slice(1);

  const periodOptions = [
    ["daily", "Daily"],
    ["weekly", "Weekly"],
    ["monthly", "Monthly"],
    ["quarterly", "Quarterly"],
    ["yearly", "Yearly"],
  ];

  return (
    <Row className="mb-4">
      <Col>
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Body className="p-4">

            <div className="d-flex justify-content-between align-items-center mb-4">

              <div className="d-flex align-items-center gap-3">

                <div className="bg-primary bg-opacity-10 text-primary rounded-4 d-flex align-items-center justify-content-center shadow-sm" style={{ width: 48, height: 48 }}>
                  <i className="bi bi-graph-up-arrow fs-4"></i>
                </div>

                <div>
                  <div className="d-flex align-items-center gap-2">

                    <h5 className="fw-bold mb-0">
                      {periodLabel} Performance
                    </h5>

                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1">
                      <i className="bi bi-activity me-1"></i>
                      Live
                    </span>

                  </div>

                  <small className="text-muted">
                    Track views and clicks performance over time
                  </small>
                </div>

              </div>

              <Dropdown align="end">
                <Dropdown.Toggle variant="light" className="border shadow-sm rounded-pill px-3 py-2 fw-semibold">
                  <i className="bi bi-calendar3 me-2 text-primary"></i>
                  {periodLabel}
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow border-0 rounded-3 p-2">
                  {periodOptions.map(([value, label]) => (
                    <Dropdown.Item key={value} active={trendPeriod === value} onClick={() => setTrendPeriod(value)} className="rounded-2 py-2">
                      <i
                        className={`bi ${
                          value === "daily"
                            ? "bi-calendar-day"
                            : value === "weekly"
                            ? "bi-calendar-week"
                            : value === "monthly"
                            ? "bi-calendar-month"
                            : value === "quarterly"
                            ? "bi-calendar-range"
                            : "bi-calendar"
                        } me-2`}
                      ></i>

                      {label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

            </div>

            <div className="d-flex align-items-center gap-2 mb-4">

              <div className="d-flex align-items-center bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill px-3 py-2">
                <span className="d-inline-block rounded-circle bg-primary me-2" style={{ width: 8, height: 8 }}></span>
                <span className="small fw-semibold text-primary">Views</span>
              </div>

              <div className="d-flex align-items-center bg-success bg-opacity-10 border border-success border-opacity-25 rounded-pill px-3 py-2">
                <span className="d-inline-block rounded-circle bg-success me-2" style={{ width: 8, height: 8 }}></span>
                <span className="small fw-semibold text-success">Clicks</span>
              </div>

            </div>

            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>

                  <defs>

                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d6efd" stopOpacity={0.45} />
                      <stop offset="70%" stopColor="#0d6efd" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#0d6efd" stopOpacity={0} />
                    </linearGradient>

                    <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#198754" stopOpacity={0.4} />
                      <stop offset="70%" stopColor="#198754" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#198754" stopOpacity={0} />
                    </linearGradient>

                  </defs>

                  <CartesianGrid vertical={false} stroke="#e9ecef" strokeDasharray="4 4" />

                  <XAxis dataKey="label" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 12, fill: "#6c757d" }} />

                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6c757d" }} />

                  <Tooltip
                    cursor={{ stroke: "#adb5bd", strokeWidth: 1, strokeDasharray: "4 4" }}
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e9ecef", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.10)", padding: "12px 16px" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Views"
                    stroke="#0d6efd"
                    strokeWidth={3}
                    fill="url(#viewsGradient)"
                    dot={{ r: 3, strokeWidth: 2, stroke: "#0d6efd", fill: "#ffffff" }}
                    activeDot={{ r: 7, strokeWidth: 3, stroke: "#ffffff", fill: "#0d6efd" }}
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />

                  <Area
                    type="monotone"
                    dataKey="clicks"
                    name="Clicks"
                    stroke="#198754"
                    strokeWidth={3}
                    fill="url(#clicksGradient)"
                    dot={{ r: 3, strokeWidth: 2, stroke: "#198754", fill: "#ffffff" }}
                    activeDot={{ r: 7, strokeWidth: 3, stroke: "#ffffff", fill: "#198754" }}
                    animationBegin={250}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />

                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: 380 }}>
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-4 mb-3">
                  <i className="bi bi-bar-chart-line fs-2"></i>
                </div>

                <h6 className="fw-semibold mb-1">
                  No Trend Data Available
                </h6>

                <small className="text-muted">
                  No {trendPeriod} performance data found
                </small>
              </div>
            )}

          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default TrendAreaChart;