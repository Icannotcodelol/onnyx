#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline";

interface RpcRequest {
  id: string | number;
  method: "sql_query" | "storage_upload" | "rpc";
  params: Record<string, unknown>;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase credentials not provided");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

async function handle(request: RpcRequest) {
  try {
    switch (request.method) {
      case "sql_query": {
        const { sql } = request.params as { sql?: string };
        if (!sql) throw new Error("sql is required");
        const { data, error } = await supabase.rpc("exec_sql", { sql });
        if (error) throw error;
        if (data && typeof data === "object" && "error" in (data as Record<string, unknown>)) {
          throw new Error(String((data as Record<string, unknown>).error));
        }
        return { id: request.id, result: data };
      }
      case "storage_upload": {
        const { bucket, path, base64 } = request.params as { bucket?: string; path?: string; base64?: string };
        if (!bucket || !path || !base64) throw new Error("bucket, path, base64 required");
        const buffer = Buffer.from(base64, "base64");
        const { error } = await supabase.storage.from(bucket).upload(path, buffer, { upsert: true });
        if (error) throw error;
        return { id: request.id, result: { path } };
      }
      case "rpc": {
        const { function: functionName, args } = request.params as { function?: string; args?: Record<string, unknown> };
        if (!functionName) throw new Error("function is required");
        const { data, error } = await supabase.rpc(functionName, args ?? {});
        if (error) throw error;
        return { id: request.id, result: data };
      }
      default:
        throw new Error(`Unsupported method ${request.method}`);
    }
  } catch (error) {
    return { id: request.id, error: String(error) };
  }
}

rl.on("line", async (line) => {
  try {
    const request = JSON.parse(line) as RpcRequest;
    const response = await handle(request);
    process.stdout.write(JSON.stringify(response) + "\n");
  } catch (error) {
    process.stdout.write(JSON.stringify({ error: String(error) }) + "\n");
  }
});
