// Advertiser plans and the rules for when an ad runs and when it expires.
//
// Plan names, prices, lengths, views, placements and display levels come from Part A of the combined
// plans document. The expiry rules come from Part C. To change a price or a limit, change it here and in
// frontend/src/plans.js (the website pages show the same numbers; this file is what the server enforces).
const db = require('./data');

const PLANS = {
	today: { key: 'today', name: 'Today', price: 199,  days: 2,  views: 2000,  maxDisplayLevel: 1, placements: ['bottom_banner'] },
	week:  { key: 'week',  name: 'Week',  price: 999,  days: 7,  views: 10000, maxDisplayLevel: 2, placements: ['bottom_banner', 'right_sidebar'] },
	month: { key: 'month', name: 'Month', price: 3499, days: 30, views: 40000, maxDisplayLevel: 3, placements: ['bottom_banner', 'right_sidebar', 'interstitial'] },
};

// Part C, decision 1 (end date).
//   true  = the ad keeps running until the end of its last day (what Part A says; the owner gets the whole day).
//   false = the ad expires as soon as its end date arrives.
// This one switch controls the dashboard, the Expired tab and the serving check, so they always agree.
const END_DATE_INCLUSIVE = true;
const SQL_END_DATE_OK = END_DATE_INCLUSIVE ? 'end_date >= CURDATE()' : 'end_date > CURDATE()';

const pad = (n) => String(n).padStart(2, '0');

// Today's date as YYYY-MM-DD in the server's local time (same format as DATE_FORMAT('%Y-%m-%d')).
const todayStr = (now = new Date()) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const addDays = (dateStr, n) => {
	const [y, m, d] = dateStr.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d + n));
	return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
};

const isRealDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDays(s, 0) === s;

// Number of days from start to end, counting both the first and the last day.
const spanDays = (start, end) => {
	const [y1, m1, d1] = start.split('-').map(Number);
	const [y2, m2, d2] = end.split('-').map(Number);
	return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000) + 1;
};

const endDatePassed = (endDate, today = todayStr()) => {
	if (!endDate) return false;
	return END_DATE_INCLUSIVE ? endDate < today : endDate <= today;
};

// Why an ad has expired, or null if it has not.
// ad needs: end_date ('YYYY-MM-DD' or empty), landing_url, remaining.
//   'date'        = the end date has passed
//   'impressions' = an activated ad has no views left
const expiryReason = (ad, today = todayStr()) => {
	if (endDatePassed(ad.end_date, today)) return 'date';
	if (ad.landing_url && Number(ad.remaining) === 0) return 'impressions';
	return null;
};

// Checks what the owner picked against the plan: placement, display level and dates.
// Returns { error } or { def, startDate, endDate } (dates filled in when they were left empty).
function validatePlanChoice(input, { today = todayStr(), isUpdate = false, existingStart = null, existingEnd = null } = {}) {
	const def = PLANS[input.plan];
	if (!def) return { error: 'Please choose a plan (Today, Week or Month).', validPlans: Object.keys(PLANS) };

	if (!def.placements.includes(input.placement)) {
		return { error: `The ${def.name} plan does not include that placement. It includes: ${def.placements.join(', ')}.` };
	}

	const level = Number(input.displaylevel);
	if (!(level >= 1 && level <= def.maxDisplayLevel)) {
		return { error: `The ${def.name} plan reaches display level ${def.maxDisplayLevel} at most.` };
	}

	const startDate = input.startdate || (isUpdate ? existingStart : null) || today;
	if (!isRealDate(startDate)) return { error: 'The start date is not a valid date.' };
	if (!isUpdate && startDate < today) return { error: 'The start date cannot be in the past.' };

	const endDate = input.enddate || (isUpdate ? existingEnd : null) || addDays(startDate, def.days - 1);
	if (!isRealDate(endDate)) return { error: 'The end date is not a valid date.' };
	if (endDate < startDate) return { error: 'The end date cannot be before the start date.' };
	if (spanDays(startDate, endDate) > def.days) {
		return { error: `The ${def.name} plan runs for up to ${def.days} day${def.days > 1 ? 's' : ''}.` };
	}

	return { def, startDate, endDate };
}

// Called every time an ad is about to be shown. In one step it checks that the ad is live, inside its dates
// and has views left, and it uses one view. Returns true when the ad may be shown.
async function claimView(adId) {
	const result = await db.query(
		`UPDATE ads SET remaining = remaining - 1
		 WHERE id = ? AND remaining > 0
		   AND CAST(isactive AS UNSIGNED) = 1
		   AND (start_date IS NULL OR start_date <= CURDATE())
		   AND (end_date IS NULL OR ${SQL_END_DATE_OK})`,
		[adId]
	);
	return result.affectedRows === 1;
}

// An ad that may not be shown right now is taken out of the rotation, so the next request moves on to another ad.
async function dropFromSequence(adId) {
	try {
		await db.query('DELETE FROM adsequence WHERE ad_id = ?', [adId]);
	} catch (err) {
		console.error('Could not remove ad from rotation:', err.message);
	}
}

module.exports = { PLANS, END_DATE_INCLUSIVE, todayStr, addDays, spanDays, isRealDate, endDatePassed, expiryReason, validatePlanChoice, claimView, dropFromSequence };