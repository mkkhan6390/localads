import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { BsLightbulb, BsCheckCircle } from "react-icons/bs";

const PRIORITY_BADGE = { high: "danger", medium: "warning", low: "success" };
const PRIORITY_LABEL = { high: "Needs attention", medium: "Worth a look", low: "Going well" };
const ACTION_LABEL = {
  activate: "Activate",
  edit: "Review ad",
  stats: "View analytics",
  relaunch: "Relaunch",
};

// Suggestions only: every button opens something the advertiser already knows (activate, edit, analytics).
// Nothing here changes an ad by itself.
const TodaysFocus = ({ items = [], hasAds = false, onAction }) => {
  if (!hasAds) return null;

  return (
    <Card as="section" aria-labelledby="todays-focus-title" className="border-0 shadow-sm rounded-3 mb-4">
      <Card.Body>
        <div className="d-flex align-items-center mb-2">
          <BsLightbulb className="me-2 text-warning" aria-hidden="true" />
          <h5 id="todays-focus-title" className="fw-bold mb-0">Today's Focus</h5>
        </div>

        {items.length === 0 ? (
          <p className="text-muted mb-0 d-flex align-items-center">
            <BsCheckCircle className="me-2 text-success" aria-hidden="true" />
            All clear. None of your campaigns need attention right now.
          </p>
        ) : (
          <ol className="list-unstyled mb-0">
            {items.map((item, index) => (
              <li
                key={`${item.adid}-${item.action}`}
                className={`d-flex flex-wrap align-items-center gap-2 py-2 ${index > 0 ? "border-top" : ""}`}
              >
                <Badge bg={PRIORITY_BADGE[item.priority] || "secondary"} text={item.priority === "medium" ? "dark" : undefined}>
                  {PRIORITY_LABEL[item.priority] || "Suggestion"}
                </Badge>
                <div className="flex-grow-1" style={{ minWidth: 220 }}>
                  <div className="fw-semibold">{item.title || `Ad #${item.adid}`}</div>
                  <div className="small text-muted">{item.reason}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => onAction && onAction(item)}
                  aria-label={`${ACTION_LABEL[item.action] || "Open"}: ${item.title || `Ad #${item.adid}`}`}
                >
                  {ACTION_LABEL[item.action] || "Open"}
                </Button>
              </li>
            ))}
          </ol>
        )}
      </Card.Body>
    </Card>
  );
};

export default TodaysFocus;
