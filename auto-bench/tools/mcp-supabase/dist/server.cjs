#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_node_readline = __toESM(require("readline"), 1);
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase credentials not provided");
  process.exit(1);
}
var supabase = (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
var rl = import_node_readline.default.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});
async function handle(request) {
  try {
    switch (request.method) {
      case "sql_query": {
        const { sql } = request.params;
        if (!sql)
          throw new Error("sql is required");
        const { data, error } = await supabase.rpc("exec_sql", { sql });
        if (error)
          throw error;
        if (data && typeof data === "object" && "error" in data) {
          throw new Error(String(data.error));
        }
        return { id: request.id, result: data };
      }
      case "storage_upload": {
        const { bucket, path, base64 } = request.params;
        if (!bucket || !path || !base64)
          throw new Error("bucket, path, base64 required");
        const buffer = Buffer.from(base64, "base64");
        const { error } = await supabase.storage.from(bucket).upload(path, buffer, { upsert: true });
        if (error)
          throw error;
        return { id: request.id, result: { path } };
      }
      case "rpc": {
        const { function: functionName, args } = request.params;
        if (!functionName)
          throw new Error("function is required");
        const { data, error } = await supabase.rpc(functionName, args ?? {});
        if (error)
          throw error;
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
    const request = JSON.parse(line);
    const response = await handle(request);
    process.stdout.write(JSON.stringify(response) + "\n");
  } catch (error) {
    process.stdout.write(JSON.stringify({ error: String(error) }) + "\n");
  }
});
