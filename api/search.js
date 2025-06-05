// api/search.js

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// 1) Set up Supabase with your Service Role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2) Set up OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 3) This default export is what Vercel runs when /api/search is called
export default async function handler(req, res) {
  // Temporarily log our environment variables:
console.log("DEBUG SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "DEBUG SUPABASE_SERVICE_ROLE_KEY (first 10 chars):",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10)

  try {
    // 3.1) Read “q” from the URL: /api/search?q=some+text
    const url = new URL(req.url);
    const query = url.searchParams.get("q");

    // 3.2) If no “q” provided, return 400 JSON error
    if (!query) {
      return res.status(400).json({ error: "Missing query (q=...)" });
    }

    // 3.3) Ask OpenAI for an embedding of the query text
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const [{ embedding }] = embeddingResponse.data;

    // 3.4) Call Supabase RPC “match_golf_courses” with that embedding
    const { data, error } = await supabase.rpc("match_golf_courses", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    // 3.5) If Supabase returns an error, send back 500 JSON
    if (error) {
      return res
        .status(500)
        .json({ error: "Supabase error: " + error.message });
    }

    // 3.6) Otherwise, return the matching courses as JSON
    return res.status(200).json(data);
  } catch (err) {
    // 3.7) If anything else throws, return a JSON error with message & stack
    return res.status(500).json({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
  }
}
