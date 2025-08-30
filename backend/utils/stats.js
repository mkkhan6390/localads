const { getDB } = require('./data')

async function getAdDashboard(adid, startDate, endDate) {

  const db = await getDB();
  const rows = await db.collection("stats").find({
    adid: adid + '',
    //dateUTC: { $gte: startDate, $lte: endDate }
  }).toArray();

  let total_clicks = 0, unique_clicks = 0, total_views = 0, unique_views = 0;
  const regions = {};
  const apps = {};
  const datetimes = {}; // year -> month -> week# -> day
  console.log(rows)
  for (const r of rows) {
    console.log('row:', r)
    total_clicks += r.total_clicks || 0;
    unique_clicks += r.unique_cicks || 0;

    total_views += r.total_views || 0;
    unique_views += r.unique_views || 0;

    // regions
    regions[r.pincode] = regions[r.pincode] || { clicks: 0, views: 0 };
    regions[r.pincode].clicks += r.total_clicks || 0;
    regions[r.pincode].views += r.total_views || 0;

    // apps
    apps[r.appid] = apps[r.appid] || { clicks: 0, views: 0 };
    apps[r.appid].clicks += r.total_clicks || 0;
    apps[r.appid].views += r.total_views || 0;

    // datetimes (year->month->weekOfMonth->dayOfMonth)
    const d = new Date(r.date + "T00:00:00Z");

    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1; // 1-12
    const day = d.getUTCDate();
    const dayName = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getUTCDay()];

    // --- calculate week of month ---
    const firstDayOfMonth = new Date(Date.UTC(year, d.getUTCMonth(), 1));
    const offset = firstDayOfMonth.getUTCDay(); // weekday of 1st of month
    const weekOfMonth = Math.ceil((day + offset) / 7);

    datetimes[year] ??= {};
    datetimes[year][month] ??= {};
    datetimes[year][month][`week${weekOfMonth}`] ??= {};
    datetimes[year][month][`week${weekOfMonth}`][day] = {
      day: dayName,
      views: r.total_views || 0,
      clicks: r.total_clicks || 0
    };
  }

  return {
    id: adid,
    total_views,
    unique_views,
    total_clicks,
    unique_clicks,
    regions,
    apps,
    datetimes
  };
}

module.exports = { getAdDashboard }