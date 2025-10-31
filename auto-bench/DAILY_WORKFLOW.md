# AutoBench Daily Workflow - API Call Management

## Overview
The AutoBench system is designed to call LLM APIs **exactly once per model per task per day**, with code stored for 24 hours. This document explains how the system prevents duplicate API calls.

## How It Works

### 1. **Task Generation (Once Daily)**
- **Trigger**: Supabase Edge Function `generate_daily_tasks` runs via cron (daily at midnight)
- **Process**:
  - Calls dispatcher `/api/generate` endpoint
  - Creates 3 new tasks with `status = 'generated'`
  - Tasks are stored in the `tasks` table with timestamp
- **Storage**: Task specs stored in `tasks.spec` (JSONB)

### 2. **Code Generation (Once per Model per Task)**
- **Trigger**: Edge Function `dispatch_and_collect` runs ~5 minutes after task generation
- **Process**:
  - Queries for tasks with `status = 'generated'`
  - Calls dispatcher `/api/dispatch` with task IDs
  - For each active model, calls the LLM API **once**
  - Stores code in `submissions` table
  - Updates task `status = 'dispatched'`
- **Duplicate Prevention**:
  - ✅ **UNIQUE constraint** on `(task_id, model_id)` in submissions table
  - ✅ Tasks change status from 'generated' → 'dispatched' (never re-dispatched)
  - ✅ If dispatcher is called again, it only finds tasks with status='generated' (none exist)

### 3. **Database Schema Protection**

```sql
-- Prevents duplicate submissions for same task+model
CREATE TABLE submissions (
  id uuid PRIMARY KEY,
  task_id uuid REFERENCES tasks(id),
  model_id uuid REFERENCES models(id),
  code text,
  status text DEFAULT 'queued',
  created_at timestamptz DEFAULT now(),
  UNIQUE (task_id, model_id)  -- ✅ CRITICAL: Prevents duplicates
);

-- Task status lifecycle
CREATE TABLE tasks (
  id uuid PRIMARY KEY,
  status text DEFAULT 'pending',  -- 'pending' → 'generated' → 'dispatched'
  created_at timestamptz DEFAULT now()
);
```

### 4. **Daily Lifecycle**

```
Day 1 (00:00 UTC):
  ├─ generate_daily_tasks runs
  ├─ Creates 3 tasks (status='generated')
  └─ Returns immediately

Day 1 (00:05 UTC):
  ├─ dispatch_and_collect runs
  ├─ Finds tasks with status='generated'
  ├─ Calls LLM APIs (OpenAI, Anthropic, Google, DeepSeek)
  ├─ Stores code in submissions table
  ├─ Updates tasks status='dispatched'
  └─ Renders artifacts

Day 1 (00:10 - 23:59):
  ├─ pair_generator runs every 10 minutes
  ├─ Creates voting matches from succeeded submissions
  └─ Users vote on arena

Day 2 (00:00 UTC):
  ├─ generate_daily_tasks runs again
  ├─ Creates 3 NEW tasks
  └─ Cycle repeats
```

### 5. **Visitor Access Pattern**

When a visitor loads the website:
- ✅ **NO API calls** to LLM providers
- ✅ Reads from `tasks`, `submissions`, `artifacts` tables
- ✅ Displays pre-generated code and rendered artifacts
- ✅ All data is cached in Supabase

### 6. **Cost Optimization**

- **LLM API calls**: 4 models × 3 tasks = **12 calls per day** (fixed)
- **No calls on**:
  - Page visits
  - Arena voting
  - Leaderboard views
  - Artifact rendering (done once during dispatch)

### 7. **Safety Mechanisms**

1. **Database Constraints**:
   - UNIQUE(task_id, model_id) prevents duplicate submissions
   - Task status prevents re-dispatching

2. **Cron Secret**:
   - Edge Functions require `x-cron-secret` header
   - Only Supabase cron can trigger generation/dispatch

3. **Status Tracking**:
   ```
   pending → generated → dispatched
   ```
   Once 'dispatched', never re-processed

4. **Idempotency**:
   - If `dispatch_and_collect` runs twice, second run finds no 'generated' tasks
   - If submission insert fails (duplicate), error is caught and ignored

## Testing the System

### Verify No Duplicates
```sql
-- Should show 0 duplicates
SELECT task_id, model_id, COUNT(*) 
FROM submissions 
GROUP BY task_id, model_id 
HAVING COUNT(*) > 1;
```

### Check Task Status Flow
```sql
-- Should only see 'dispatched' for today's tasks
SELECT id, title, status, created_at 
FROM tasks 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Verify Single Generation Per Day
```sql
-- Should show ~3 tasks per day
SELECT DATE(created_at) as day, COUNT(*) as task_count
FROM tasks
GROUP BY DATE(created_at)
ORDER BY day DESC;
```

## Conclusion

✅ **LLM APIs are called exactly once per model per task**  
✅ **Code is stored for 24+ hours** (persists in database)  
✅ **Visitors never trigger API calls**  
✅ **Database constraints prevent duplicates**  
✅ **Status workflow prevents re-processing**

The system is designed for cost efficiency and reliability, ensuring predictable API usage regardless of website traffic.
