// api/search.js

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// 1) We only add these two console.log lines temporarily, to verify the env var is correct.
//    You can remove them later once you see the correct URL in the Vercel logs.
export default async function handler(req, res) {
  // Log out the Supabase URL and the first 10 characters of the service role key:
  console.log("DEBUG SUPABASE_URL:", process.env.SUPABASE_URL);
  console.log(
    "DEBUG SUPABASE_SERVICE_ROLE_KEY (first 10 chars):",
    process.env.SUPABASE_SERVICE_ROLE_KEY
      ? process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 10)
      : "undefined"
  );

  try {
    // 2) Parse the incoming URL to get the 'q' parameter:
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    if (!query) {
      return res.status(400).json({ error: "Missing query (q=...)" });
    }

    // 3) Now that we have confirmed the env vars, create the Supabase client:
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4) Create the OpenAI client:
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 5) Ask OpenAI for an embedding of the query:
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const [{ embedding }] = embeddingResponse.data;

    // 6) Call the Supabase RPC function "match_golf_courses":
    const { data, error } = await supabase.rpc("match_golf_courses", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (error) {
      return res.status(500).json({ error: "Supabase error: " + error.message });
    }

    // 7) Return the matched courses:
    return res.status(200).json(data);
  } catch (err) {
    // If anything else throws, return a JSON error with stack:
    return res.status(500).json({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
  }
}
