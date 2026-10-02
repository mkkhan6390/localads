import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodaysFocus from "./TodaysFocus";

const items = [
  { adid: 4, title: "Diwali Sale", priority: "high", action: "edit", reason: "Live, but nobody has seen it in 7 days." },
  { adid: 9, title: "Cafe Promo", priority: "low", action: "stats", reason: "Doing well." },
];

test("shows nothing before the user has any ads", () => {
  const { container } = render(<TodaysFocus items={[]} hasAds={false} />);
  expect(container).toBeEmptyDOMElement();
});

test("shows an all-clear message when nothing needs attention", () => {
  render(<TodaysFocus items={[]} hasAds />);
  expect(screen.getByText(/all clear/i)).toBeInTheDocument();
});

test("lists suggestions and reports which one was clicked", () => {
  const onAction = jest.fn();
  render(<TodaysFocus items={items} hasAds onAction={onAction} />);

  expect(screen.getByText("Diwali Sale")).toBeInTheDocument();
  userEvent.click(screen.getByRole("button", { name: /review ad: diwali sale/i }));
  expect(onAction).toHaveBeenCalledWith(items[0]);
});
