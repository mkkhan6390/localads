import React, { useState, useEffect } from "react";
import { Row, Col, Dropdown } from "react-bootstrap";
import PerformanceOverviewChart from "./PerformanceOverviewChart";
import LocationPieChart from "./LocationPieChart";
import TrendAreaChart from "./TrendAreaChart";

const metricCards = [
  { title: "Total Views", key: "total_views", icon: "bi-eye-fill" },
  { title: "Unique Views", key: "unique_views", icon: "bi-person-fill" },
  { title: "Total Clicks", key: "total_clicks", icon: "bi-cursor-fill" },
  { title: "Unique Clicks", key: "unique_clicks", icon: "bi-person-check-fill" },
];

const normalizeDayTrendData = (dateMap = {}) => {
  const result = [];

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
              clicks,
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
        (ad) =>
          (ad.id || ad.adid) ===
          (prevSelectedAd.id || prevSelectedAd.adid)
      );

      return matchingAd || adsData[0];
    });
  }, [adsData]);

  if (!selectedAd) {
    return <p>No statistics available</p>;
  }

  const fallbackTrendData = normalizeDayTrendData(selectedAd.datetimes);

  const trendData =
    selectedAd.trendData?.[trendPeriod] || fallbackTrendData;

  const chartTrendData = trendData.map((entry) => ({
    ...entry,
    label: entry.label || entry.period || entry.day || "Unknown",
  }));

  const viewsByLocationData = (
    selectedAd.viewsByLocation?.[locationFilter] || []
  ).map((entry) => ({
    ...entry,
    name:
      locationFilter === "pincode"
        ? entry.pincode
        : entry.name,
    uniqueViews:
      Number(entry.uniqueViews ?? entry.unique_views) || 0,
  }));

  const clicksByLocationData = (
    selectedAd.clicksByLocation?.[clickLocationFilter] || []
  ).map((entry) => ({
    ...entry,
    name:
      clickLocationFilter === "pincode"
        ? entry.pincode
        : entry.name,
    uniqueClicks:
      Number(entry.uniqueClicks ?? entry.unique_clicks) || 0,
  }));

  return (
    <div className="statistics-page">

      {/* Ad Selector */}
      <Row className="mb-4">
        <Col>
          <Dropdown>
            <Dropdown.Toggle
              variant="outline-primary"
              className="shadow-sm rounded-pill px-4"
            >
              {selectedAd.title ||
                `Ad #${selectedAd.id || selectedAd.adid}`}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {adsData.map((ad) => (
                <Dropdown.Item
                  key={ad.id || ad.adid}
                  onClick={() => setSelectedAd(ad)}
                  active={
                    (ad.id || ad.adid) ===
                    (selectedAd.id || selectedAd.adid)
                  }
                >
                  {ad.title || `Ad #${ad.id || ad.adid}`}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row className="g-2 mb-3">
        {metricCards.map(({ title, key, icon }) => (
          <Col xl={3} md={6} key={key}>
            <div className="card border-primary border-opacity-25 bg-primary bg-opacity-10 shadow-sm rounded-3 h-100">
              <div className="card-body py-2 px-3">
                <div className="d-flex align-items-center gap-2">

                  <div
                    className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "34px", height: "34px", minWidth: "34px" }}
                  >
                    <i className={`bi ${icon}`}></i>
                  </div>

                  <div>
                    <div className="small fw-semibold text-primary-emphasis lh-sm">
                      {title}
                    </div>

                    <div className="fw-bold fs-5 lh-sm mt-1">
                      {selectedAd?.[key]?.toLocaleString() ?? 0}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Performance Overview Chart */}
      <PerformanceOverviewChart selectedAd={selectedAd} />

      {/* Location Charts */}
      <Row className="mb-5 g-4">

        <Col lg={6}>
          <LocationPieChart
            type="views"
            data={viewsByLocationData}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            locationMetric={locationMetric}
            setLocationMetric={setLocationMetric}
          />
        </Col>

        <Col lg={6}>
          <LocationPieChart
            type="clicks"
            data={clicksByLocationData}
            locationFilter={clickLocationFilter}
            setLocationFilter={setClickLocationFilter}
            locationMetric={clickLocationMetric}
            setLocationMetric={setClickLocationMetric}
          />
        </Col>

      </Row>

      {/* Trend Chart */}
      <TrendAreaChart
        data={chartTrendData}
        trendPeriod={trendPeriod}
        setTrendPeriod={setTrendPeriod}
      />

    </div>
  );
};

export default Statistics;