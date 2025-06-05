// api/search.js

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Debugging environment variables
  console.log("DEBUG SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log(
    "DEBUG SUPABASE_SERVICE_ROLE_KEY (first 10 chars):",
    process.env.SUPABASE_SERVICE_ROLE_KEY
      ? process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 10)
      : "undefined"
  );
  console.log(
    "DEBUG OPENAI_API_KEY (first 10 chars):",
    process.env.OPENAI_API_KEY
      ? process.env.OPENAI_API_KEY.slice(0, 10)
      : "undefined"
  );

  try {
    // Build a full URL for parsing query parameters
    const base = `https://${req.headers.host}`;
    const url = new URL(req.url, base);
    const query = url.searchParams.get("q");
    if (!query) {
      return res.status(400).json({ error: "Missing query (q=...)" });
    }

    // 1) Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2) Create OpenAI client
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Debug before calling OpenAI
    console.log("DEBUG: Calling OpenAI embeddings.create for query:", query);

    // 3) Ask OpenAI for an embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    console.log("DEBUG: OpenAI embedding response received");

    const [{ embedding }] = embeddingResponse.data;

    // Debug before calling Supabase
    console.log("DEBUG: Calling Supabase RPC match_golf_courses");

    // 4) Call Supabase RPC "match_golf_courses"
    const { data, error } = await supabase.rpc("match_golf_courses", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return res.status(500).json({ error: "Supabase error: " + error.message });
    }

    // 5) Return the matched courses
    return res.status(200).json(data);
  } catch (err) {
    // Log the caught error before returning
    console.error("Caught error in /api/search:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
  }
}
