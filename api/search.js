// api/search.js

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Debugging: log what Vercel sees for SUPABASE_URL and SERVICE_ROLE_KEY
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
    // 1) Build a full URL using req.url (path) plus the host header
    //    e.g. if req.url = "/api/search?q=belden%20hill" and host = "golfbot-search-api-v2.vercel.app",
    //    then new URL(req.url, `https://golfbot-search-api-v2.vercel.app`)
    const base = `https://${req.headers.host}`; 
    const url = new URL(req.url, base);
    const query = url.searchParams.get("q");
    if (!query) {
      return res.status(400).json({ error: "Missing query (q=...)" });
    }

    // 2) Now create the Supabase client using the correct URL & key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 3) Create the OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 4) Get an embedding from OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const [{ embedding }] = embeddingResponse.data;

    // 5) Call your Supabase RPC "match_golf_courses"
    const { data, error } = await supabase.rpc("match_golf_courses", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (error) {
      return res.status(500).json({ error: "Supabase error: " + error.message });
    }

    // 6) Return the matched courses as JSON
    return res.status(200).json(data);
  } catch (err) {
    // 7) Catch any other errors and send them back as JSON
    return res.status(500).json({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
  }
}
