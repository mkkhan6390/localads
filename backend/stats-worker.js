// stats-worker.js
const { MongoClient } = require("mongodb");

(async function startWorker() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("ads");

  // Helper: convert month number → short name
  const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

  for (const kind of ["clicks", "views"]) {
    // ---------- PART 1: totals ----------
    const pipeline = [
      {
        $group: {
          _id: {
            adid: "$adid",
            appid: "$appid",
            pincode: "$pincode",
            ip: "$ip",
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
            weekday: { $dayOfWeek: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      }
    ];

    const cursor = db.collection(kind).aggregate(pipeline);
    const results = await cursor.toArray();

    for (const r of results) {
      const { adid, appid, pincode, ip, year, month, day } = r._id;

      const d = new Date(Date.UTC(year, month - 1, day));
      const weekOfMonth = Math.ceil(day / 7);
      const monthKey = monthNames[month - 1];
      const dayName = ["sun","mon","tue","wed","thu","fri","sat"][d.getUTCDay()];

      const incObj = {};
      const setObj = {};

      // Totals
      incObj[`total_${kind}`] = r.count;

      // Regions
      incObj[`regions.${pincode}.${kind}`] = r.count;

      // Apps
      incObj[`apps.${appid}.${kind}`] = r.count;

      // Datetimes
      incObj[`datetimes.${year}.${monthKey}.week${weekOfMonth}.${day}.${kind}`] = r.count;
      setObj[`datetimes.${year}.${monthKey}.week${weekOfMonth}.${day}.day`] = dayName;

      await db.collection("stats").updateOne(
        { adid, year, month },
        { $inc: incObj, $set: setObj },
        { upsert: true }
      );
    }

    // ---------- PART 2: uniques (by IP) ----------
    const uniquePipeline = [
      {
        $group: {
          _id: {
            adid: "$adid",
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" },
            ip: "$ip"
          }
        }
      },
      {
        $group: {
          _id: { adid: "$_id.adid", year: "$_id.year", month: "$_id.month" },
          uniqueCount: { $sum: 1 }
        }
      }
    ];

    const uniqCursor = db.collection(kind).aggregate(uniquePipeline);
    const uniqResults = await uniqCursor.toArray();

    for (const u of uniqResults) {
      const { adid, year, month } = u._id;
      const field = `unique_${kind}`;

      await db.collection("stats").updateOne(
        { adid, year, month },
        { $set: { [field]: u.uniqueCount } },
        { upsert: true }
      );
    }
  }

  console.log("Monthly stats aggregation (totals + uniques) complete ✅");
  await client.close();
})();
