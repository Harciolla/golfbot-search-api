// api/search.js

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Debug environment variables:
  console.log("DEBUG SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log(
    "DEBUG SUPABASE_SERVICE_ROLE_KEY (first 10 chars):",
    process.env.SUPABASE_SERVICE_ROLE_KEY
      ? process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 10)
      : "undefined"
  );

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Try a simple SELECT on your golf_courses table (limit 1 row)
    console.log("DEBUG: Running supabase.from('golf_courses').select('*').limit(1)");
    const { data, error } = await supabase
      .from("golf_courses")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase simple‐select error:", error);
      return res
        .status(500)
        .json({ error: "Supabase simple‐select error: " + error.message });
    }

    // Return the first row (or empty array if no rows exist)
    return res.status(200).json({ data });
  } catch (err) {
    console.error("Caught error in simple‐select:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
  }
}
