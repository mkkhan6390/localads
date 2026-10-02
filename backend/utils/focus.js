// "Today's Focus": a short, ordered list of campaigns that need the advertiser's attention.
// Plain rules on data we already have, so it is fast, free and explainable. The dashboard only
// SUGGESTS actions; nothing here changes an ad.

const DAY_MS = 24 * 60 * 60 * 1000;

// Tweak these numbers to change how sensitive the suggestions are.
const LOW_REMAINING = 10;        // "running low" when this few impressions are left
const NO_TRAFFIC_AFTER_DAYS = 3; // an active ad older than this with no views last 7 days is suspicious
const MIN_VIEWS_FOR_CTR = 50;    // need this many views in 7 days before judging click rate
const LOW_CTR = 0.005;           // below 0.5% is "low"
const GOOD_CTR = 0.02;           // 2% or better is "doing well"
const MIN_VIEWS_FOR_GOOD = 20;
const MAX_ITEMS = 5;

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const percent = (ratio) => `${(ratio * 100).toFixed(1)}%`;

// ads: rows from /dashboard (already carrying is_expired, remaining, views_7d, clicks_7d, ...).
// views_7d / clicks_7d are undefined when traffic could not be loaded; those rules are then skipped.
function buildFocus(ads, now = Date.now()) {
	const items = [];
	let bestPerformer = null;

	for (const ad of ads) {
		const base = { adid: ad.id, title: ad.title };
		const active = Number(ad.isactive) === 1;
		const trafficKnown = typeof ad.views_7d === 'number';

		if (ad.is_expired) {
			items.push({ ...base, priority: 'high', action: 'relaunch', reason: 'Ran out of impressions and is no longer being shown. Relaunch it to keep running.' });
			continue;
		}

		if (!active) {
			if (!ad.landing_url) {
				items.push({ ...base, priority: 'high', action: 'activate', reason: 'Not live yet. Add a landing page and activate it to start reaching people.' });
			}
			continue; // a paused ad is the owner's choice, so no nagging
		}

		const remaining = Number(ad.remaining);
		if (remaining > 0 && remaining <= LOW_REMAINING) {
			items.push({ ...base, priority: 'medium', action: 'stats', reason: `Only ${remaining} impressions left. It will stop showing soon.` });
		}

		if (!trafficKnown) continue;

		const ageDays = (now - new Date(ad.added_date).getTime()) / DAY_MS;
		if (ad.views_7d === 0 && ageDays > NO_TRAFFIC_AFTER_DAYS) {
			items.push({ ...base, priority: 'high', action: 'edit', reason: 'Live, but nobody has seen it in 7 days. Check its pincode and placement.' });
			continue;
		}

		if (ad.views_7d >= MIN_VIEWS_FOR_CTR) {
			const ctr = ad.clicks_7d / ad.views_7d;
			if (ctr < LOW_CTR) {
				items.push({ ...base, priority: 'medium', action: 'edit', reason: `Low click rate (${percent(ctr)} over 7 days). A clearer image or a different offer may help.` });
			}
		}

		if (ad.views_7d >= MIN_VIEWS_FOR_GOOD) {
			const ctr = ad.clicks_7d / ad.views_7d;
			if (ctr >= GOOD_CTR && (!bestPerformer || ctr > bestPerformer.ctr)) bestPerformer = { ad, ctr };
		}
	}

	if (bestPerformer) {
		items.push({
			adid: bestPerformer.ad.id, title: bestPerformer.ad.title, priority: 'low', action: 'stats',
			reason: `Doing well: ${percent(bestPerformer.ctr)} click rate over 7 days. See where it works best.`,
		});
	}

	// stable sort: high first, then medium, then low; original order kept inside each group
	return items
		.map((item, index) => ({ item, index }))
		.sort((a, b) => PRIORITY_ORDER[a.item.priority] - PRIORITY_ORDER[b.item.priority] || a.index - b.index)
		.map(({ item }) => item)
		.slice(0, MAX_ITEMS);
}

module.exports = { buildFocus };
