const express = require("express");
const router = express.Router();
const db = require("../db");
const { enqueueComplaint } = require("../queue/jobQueue");

// Submit a new complaint — inserted immediately, then processed async via the job queue.
router.post("/", async (req, res) => {
  const { title, text, district, village_locality, people_affected, latitude, longitude, attachments } = req.body;

  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  const { data, error } = await db
    .from("complaints")
    .insert([
      {
        title: title || null,
        raw_text: text,
        district: district || null,
        village_locality: village_locality || null,
        people_affected: Number(people_affected) || 0,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        attachments: attachments || [],
        status: "queued"
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Insert error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }

  enqueueComplaint(data.id);
  res.status(201).json({ id: data.id, status: data.status });
});

// Poll a single complaint's status/results.
router.get("/:id", async (req, res) => {
  const { data, error } = await db
    .from("complaints")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "not found" });
  }

  res.json(data);
});

// Everything ranked by criticality score, duplicates excluded.
router.get("/", async (req, res) => {
  const { data, error } = await db
    .from("complaints")
    .select("*")
    .is("duplicate_of", null)
    .order("criticality_score", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("List error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }

  res.json(data);
});

module.exports = router;
