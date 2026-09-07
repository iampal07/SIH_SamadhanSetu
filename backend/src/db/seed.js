const fs = require("fs");
const path = require("path");
const db = require("./index");

const institutes = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "..", "data", "institutes.sample.json"), "utf-8")
);

async function seed() {
  const { count, error: countError } = await db
    .from("institutes")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Could not read institutes table — did you run data/schema.sql in the Supabase SQL editor?", countError);
    process.exit(1);
  }

  if (count > 0) {
    console.log(`Institutes table already has ${count} rows — skipping seed.`);
    process.exit(0);
  }

  const rows = institutes.map((row) => ({
    name: row.name,
    nirf_rank: row.nirf_rank || null,
    domains: row.domains || [],
    past_projects: row.past_projects || []
  }));

  const { error } = await db.from("institutes").insert(rows);

  if (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} institutes.`);
  process.exit(0);
}

seed();
