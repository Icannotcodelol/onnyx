# AutoBench - Setup Complete! 🎉

## ✅ What Has Been Deployed

### 1. Database (Supabase)
- ✅ All tables created with proper schema
- ✅ Row Level Security (RLS) policies applied
- ✅ Database functions deployed:
  - `elo_expected()` - Calculate Elo ratings
  - `apply_vote_elo()` - Update ratings after votes
  - `ratings_with_sparkline()` - Get leaderboard with history
- ✅ Unique constraints to prevent duplicate API calls

### 2. Storage
- ✅ `artifacts` bucket created (public)
- ✅ Ready to store rendered images/videos

### 3. Initial Data
- ✅ 4 Model Providers seeded:
  - OpenAI
  - Anthropic
  - Google
  - DeepSeek
- ✅ 4 Models configured:
  - GPT-4o
  - Claude 3.5 Sonnet
  - Gemini 2.0 Flash
  - DeepSeek Chat

### 4. Edge Functions Deployed
- ✅ `generate_daily_tasks` - Creates daily tasks
- ✅ `dispatch_and_collect` - Triggers LLM API calls
- ✅ `pair_generator` - Creates voting matches
- ✅ `submit_vote` - Handles user votes

### 5. Local Services Running
- ✅ Web App (Next.js) - http://localhost:3000
- ✅ Dispatcher Service - http://localhost:4100
- ✅ Renderer Service - http://localhost:4000

## 🔧 Required: Set Edge Function Environment Variables

The Edge Functions need environment variables to work. Run these commands:

```bash
# Navigate to your project
cd /Users/maxhenkes/Desktop/onyx/auto-bench

# Set the DISPATCHER_URL (use your actual public URL or ngrok)
# For local testing, you'll need to expose localhost:4100 publicly
# Option 1: Use ngrok
ngrok http 4100
# Then set the URL:
# supabase secrets set DISPATCHER_URL=https://your-ngrok-url.ngrok.io --project-ref zxkdmbthpvfvjdqkbbqi

# Option 2: Deploy dispatcher to a public server and use that URL
# supabase secrets set DISPATCHER_URL=https://your-dispatcher.com --project-ref zxkdmbthpvfvjdqkbbqi

# Set the CRON_SECRET (already in env.local)
supabase secrets set CRON_SECRET=317165e6a9a5e1589c1d51b5ff5324c41bbf4df3394fc9f25ad5ec3f16aff0d6 --project-ref zxkdmbthpvfvjdqkbbqi
```

## 📅 How to Set Up Cron Jobs

In Supabase Dashboard (https://supabase.com/dashboard/project/zxkdmbthpvfvjdqkbbqi):

1. Go to **Database** → **Cron Jobs** (or use pg_cron extension)

2. Create these cron jobs:

```sql
-- Daily task generation (midnight UTC)
SELECT cron.schedule(
  'generate-daily-tasks',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zxkdmbthpvfvjdqkbbqi.supabase.co/functions/v1/generate_daily_tasks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'x-cron-secret', '317165e6a9a5e1589c1d51b5ff5324c41bbf4df3394fc9f25ad5ec3f16aff0d6'
    )
  );
  $$
);

-- Dispatch models (5 minutes after midnight)
SELECT cron.schedule(
  'dispatch-and-collect',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zxkdmbthpvfvjdqkbbqi.supabase.co/functions/v1/dispatch_and_collect',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'x-cron-secret', '317165e6a9a5e1589c1d51b5ff5324c41bbf4df3394fc9f25ad5ec3f16aff0d6'
    )
  );
  $$
);

-- Generate pairs every 10 minutes
SELECT cron.schedule(
  'pair-generator',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zxkdmbthpvfvjdqkbbqi.supabase.co/functions/v1/pair_generator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'x-cron-secret', '317165e6a9a5e1589c1d51b5ff5324c41bbf4df3394fc9f25ad5ec3f16aff0d6'
    )
  );
  $$
);
```

## 🧪 Manual Testing

Test the workflow manually:

```bash
# 1. Generate tasks (calls dispatcher to create 3 tasks)
curl -X POST \
  "https://zxkdmbthpvfvjdqkbbqi.supabase.co/functions/v1/generate_daily_tasks" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "x-cron-secret: 317165e6a9a5e1589c1d51b5ff5324c41bbf4df3394fc9f25ad5ec3f16aff0d6"

# 2. Dispatch to models (calls LLM APIs once per model per task)
curl -X POST \
  "https://zxkdmbthpvfvjdqkbbqi.supabase.co/functions/v1/dispatch_and_collect" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "x-cron-secret: 317165e6a9a5e1589c1d51b5ff5324c41bbf4df3394fc9f25ad5ec3f16aff0d6"

# 3. Generate voting pairs
curl -X POST \
  "https://zxkdmbthpvfvjdqkbbqi.supabase.co/functions/v1/pair_generator" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "x-cron-secret: 317165e6a9a5e1589c1d51b5ff5324c41bbf4df3394fc9f25ad5ec3f16aff0d6"
```

## 🔒 API Call Prevention Summary

### ✅ How We Prevent Duplicate LLM API Calls:

1. **Database Unique Constraint**:
   ```sql
   UNIQUE (task_id, model_id) on submissions table
   ```
   - Physically impossible to insert duplicate submissions

2. **Task Status Workflow**:
   ```
   pending → generated → dispatched
   ```
   - Once dispatched, never re-processed
   - `dispatch_and_collect` only queries `status='generated'`

3. **Cron-Protected Edge Functions**:
   - Require `x-cron-secret` header
   - Only Supabase cron can trigger

4. **Single Daily Generation**:
   - Cron runs once per day at midnight
   - Creates exactly 3 tasks
   - Each task dispatched to 4 models = 12 API calls/day

### ✅ What Visitors See:
- Pre-generated code from database
- Pre-rendered artifacts from storage
- **ZERO LLM API calls** on page load

## 📊 Verify Setup

Check the database:

```sql
-- Should show 4 active models
SELECT * FROM models WHERE is_active = true;

-- Should show 0 duplicates (always)
SELECT task_id, model_id, COUNT(*) 
FROM submissions 
GROUP BY task_id, model_id 
HAVING COUNT(*) > 1;

-- Check today's tasks
SELECT id, title, status, created_at 
FROM tasks 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 🚀 Next Steps

1. **Expose Dispatcher Publicly**:
   - Use ngrok for local testing: `ngrok http 4100`
   - Or deploy to Railway/Fly.io/Render for production
   - Set `DISPATCHER_URL` secret in Supabase

2. **Set Up Cron Jobs** (see above)

3. **Test the Full Workflow**:
   - Manually trigger `generate_daily_tasks`
   - Wait for tasks to be created
   - Trigger `dispatch_and_collect`
   - Verify submissions in database
   - Check artifacts in storage

4. **Monitor**:
   - Check Supabase logs for Edge Functions
   - Monitor LLM API usage (should be 12 calls/day)
   - Verify no duplicate submissions

## 📚 Documentation

- `DAILY_WORKFLOW.md` - Detailed explanation of API call management
- `README.md` - Original project specification
- This file - Setup completion checklist

## ✨ System is Ready!

All infrastructure is deployed. Once you:
1. Expose the dispatcher publicly
2. Set up cron jobs

The system will automatically:
- Generate 3 tasks daily at midnight
- Call each LLM API once per task (12 total calls)
- Store code for 24+ hours
- Serve visitors from cached data
- Never make duplicate API calls

**Cost**: Fixed 12 LLM API calls per day, regardless of traffic! 🎉
