const express = require("express");
const router = express.Router();

const db = require("../utils/data");
const {authenticateuser} = require('../utils/authentication')


// ✅ GET all apps for logged-in publisher
router.get("/", authenticateuser, async (req, res) => {
    console.log('user',req.body)
  try {
    const rows = await db.query( "SELECT a.id, a.name, a.description, a.user_id, a.type, u.apikey, u.username FROM apps a join users u on u.id=a.user_id where user_id = ?", [req.body.userid] );
    return res.json(rows);
  } catch (err) {
    console.error("Error fetching apps:", err);
    return res.status(500).json({ error: "Failed to fetch apps" });
  }
});

// ✅ POST add new app
router.post("/add", authenticateuser, async (req, res) => {
  try {
    const { appName, appType, appIdentifier, description } = req.body;

    if (!appName || !appType || !appIdentifier) {
      return res.status(400).json({ error: "Missing required fields" });
    }
 
    const result = await db.query(
      "INSERT INTO apps (user_id, name, app_type, app_identifier, description) VALUES ( ?, ?, ?, ?, ?)",
      [req.user.id, appName, appType, appIdentifier, description]
    );
 
    return res.status(201).json({message:"App added successfully", appid: result.insertId});

  } catch (err) {
    console.error("Error adding app:", err);
    return res.status(500).json({ error: "Failed to register app" });
  }
});

// ✅ DELETE an app
router.delete("/:id", authenticateuser, async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM apps WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "App not found or not owned by user" });
    }

    return res.json({ message: "App deleted successfully" });
  } catch (err) {
    console.error("Error deleting app:", err);
    return res.status(500).json({ error: "Failed to delete app" });
  }
});

module.exports = router;
