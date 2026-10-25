// Advertiser plans shown in the New Ad form and the Re-Launch screen (Part A of the combined plans document).
// Keep these numbers the same as backend/utils/plans.js. The server checks every request against its own copy.

export const PLANS = {
  today: { key: 'today', name: 'Today', price: 199,  days: 2,  views: 2000,  maxDisplayLevel: 1, placements: ['bottom_banner'],                                   tagline: 'A short offer or event' },
  week:  { key: 'week',  name: 'Week',  price: 999,  days: 7,  views: 10000, maxDisplayLevel: 2, placements: ['bottom_banner', 'right_sidebar'],                  tagline: 'A one-week push' },
  month: { key: 'month', name: 'Month', price: 3499, days: 30, views: 40000, maxDisplayLevel: 3, placements: ['bottom_banner', 'right_sidebar', 'interstitial'], tagline: 'A month of wide visibility' },
};

export const PLAN_LIST = Object.values(PLANS);

export const PLACEMENT_NAMES = {
  bottom_banner: 'Bottom Banner',
  right_sidebar: 'Right Sidebar',
  interstitial: 'Interstitial',
};

export const DISPLAY_LEVELS = [
  { value: '1', label: 'City' },
  { value: '2', label: 'District' },
  { value: '3', label: 'State' },
  { value: '4', label: 'Country' },
];

const pad = (n) => String(n).padStart(2, '0');

// Today's date as YYYY-MM-DD in the browser's local time (the format <input type="date"> uses).
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
};

// Days from start to end, counting both the first and the last day.
export const spanDays = (start, end) => {
  const [y1, m1, d1] = start.split('-').map(Number);
  const [y2, m2, d2] = end.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
};

// The last end date the plan allows for a given start date.
export const maxEndDate = (planKey, startDate) => addDays(startDate, PLANS[planKey].days - 1);

// Quick date choices for each plan (Part A: dates come from presets, with a custom option).
export const datePresets = (planKey) => {
  const today = todayStr();
  if (planKey === 'today') {
    const dow = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const weekendStart = dow === 6 || dow === 0 ? today : addDays(today, 6 - dow);
    const weekendEnd = dow === 0 ? today : addDays(weekendStart, 1);
    return [
      { label: 'Today only', start: today, end: today },
      { label: 'This weekend', start: weekendStart, end: weekendEnd },
    ];
  }
  if (planKey === 'week') return [{ label: 'This week (7 days)', start: today, end: addDays(today, 6) }];
  if (planKey === 'month') return [{ label: 'Next 30 days', start: today, end: addDays(today, 29) }];
  return [];
};

export const formatINR = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export const formatDay = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};