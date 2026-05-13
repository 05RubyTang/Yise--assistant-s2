# 存量孤儿行人工处理 SOP

**适用场景：** 用户反馈「换设备/浏览器登录后数据缺失」，且发生在 2025-05-10 本次修复上线之前。  
**Supabase 项目：** `gcjtgvlosykgjhyutbak`  
**SQL Editor：** https://supabase.com/dashboard/project/gcjtgvlosykgjhyutbak/editor

---

## 背景说明

旧代码的 bug：用户在新设备上打开 App（匿名登录产生 UID_B），之后输入邮箱 OTP 登录（切换到正式 UID_A），这个过程中旧代码会把 UID_A 的 `user_email` 字段清空，导致下次换设备时找不到这条数据，数据无法合并。

新代码（2025-05-10 上线）已修复此问题：不再清空 `user_email`，并在 OTP 登录后删除 UID_B 临时行。

**对存量用户：** 已被清空 `user_email` 的孤儿行需要人工把 email 补回来，之后让用户重新登录一次即可自动合并。

---

## Step 0：收集用户信息

向用户确认以下内容：

- [ ] 登录邮箱地址
- [ ] 大概什么时候开始使用（方便缩小时间范围）
- [ ] 缺失的是哪类数据（已获得的异色精灵？刷取记录条数？）

---

## Step 1：找到用户的正式 UID_A

```sql
-- 从 auth.users 找正式 uid
SELECT id AS uid_a, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = '用户邮箱@xxx.com';
```

📌 记录下 `uid_a` 的值，后续步骤都需要用到。

---

## Step 2：查 UID_A 现有数据情况

```sql
-- 看 UID_A 的当前数据
SELECT
  user_id,
  user_email,
  device_id,
  created_at,
  updated_at,
  jsonb_array_length(COALESCE(completed_tasks_full, '[]'::jsonb)) AS full_task_count,
  (SELECT COUNT(*) FROM jsonb_each(COALESCE(data->'spirits', '{}'::jsonb)) kv(k,v)
   WHERE (v->>'obtained')::boolean = true) AS obtained_count,
  (SELECT string_agg(k, '、') FROM jsonb_each(COALESCE(data->'spirits', '{}'::jsonb)) kv(k,v)
   WHERE (v->>'obtained')::boolean = true) AS obtained_names
FROM user_data
WHERE user_id = '这里填uid_a';
```

将结果中的 `obtained_names`（已有的异色精灵名）和 `full_task_count`（刷取记录数）与用户描述的缺失情况对比，确认缺少的数据量级。

---

## Step 3：找出孤儿行

由于旧代码清空了 `user_email`，无法直接按 email 查，需要通过 `device_id` 或时间范围来推断。

### 方法 A：按 device_id 匹配（优先用）

```sql
-- 找与 UID_A 同设备的其他行
SELECT
  user_id,
  user_email,
  pending_bind_email,
  device_id,
  created_at,
  updated_at,
  jsonb_array_length(COALESCE(completed_tasks_full, '[]'::jsonb)) AS full_task_count,
  (SELECT COUNT(*) FROM jsonb_each(COALESCE(data->'spirits', '{}'::jsonb)) kv(k,v)
   WHERE (v->>'obtained')::boolean = true) AS obtained_count
FROM user_data
WHERE device_id = (SELECT device_id FROM user_data WHERE user_id = '这里填uid_a')
  AND user_id != '这里填uid_a'
ORDER BY updated_at DESC;
```

### 方法 B：按时间范围找可疑孤儿行（device_id 对不上时使用）

```sql
-- 找时间范围内 email 为空但有数据的行
SELECT
  user_id,
  user_email,
  device_id,
  created_at,
  updated_at,
  jsonb_array_length(COALESCE(completed_tasks_full, '[]'::jsonb)) AS full_task_count,
  (SELECT COUNT(*) FROM jsonb_each(COALESCE(data->'spirits', '{}'::jsonb)) kv(k,v)
   WHERE (v->>'obtained')::boolean = true) AS obtained_count
FROM user_data
WHERE user_email IS NULL
  AND pending_bind_email IS NULL
  AND created_at BETWEEN '2025-01-01' AND NOW()  -- 按用户注册时间调整范围
  AND (
    jsonb_array_length(COALESCE(completed_tasks_full, '[]'::jsonb)) > 0
    OR (SELECT COUNT(*) FROM jsonb_each(COALESCE(data->'spirits', '{}'::jsonb)) kv(k,v)
        WHERE (v->>'obtained')::boolean = true) > 0
  )
ORDER BY updated_at DESC
LIMIT 20;
```

---

## Step 4：核对孤儿行是否属于该用户

对 Step 3 找到的可疑行，查看具体数据内容：

```sql
-- 查看孤儿行的具体数据内容（把可疑的 user_id 填进去）
SELECT
  user_id,
  device_id,
  created_at,
  updated_at,
  (SELECT string_agg(k, '、') FROM jsonb_each(COALESCE(data->'spirits', '{}'::jsonb)) kv(k,v)
   WHERE (v->>'obtained')::boolean = true) AS obtained_names,
  (SELECT jsonb_agg(task->>'completedAt')
   FROM jsonb_array_elements(COALESCE(completed_tasks_full, '[]'::jsonb)) task
   LIMIT 5) AS recent_task_times
FROM user_data
WHERE user_id IN ('孤儿行uid_1', '孤儿行uid_2');
```

**与用户核对确认：**
> 「我这里看到一些数据记录（异色精灵：xxx；时间：xxx），这是你的记录吗？」

⚠️ **必须用户明确确认后才能执行下一步，不可凭猜测操作。**

---

## Step 5：给孤儿行补回 email 标记

用户确认孤儿行归属后，执行以下 SQL 把 email 补回去：

```sql
-- 给孤儿行打上 email 标记，下次 OTP 登录时会自动合并
UPDATE user_data
SET
  user_email = '用户邮箱@xxx.com',
  pending_bind_email = '用户邮箱@xxx.com',
  updated_at = NOW()
WHERE user_id IN ('孤儿行uid_1', '孤儿行uid_2');  -- 填入已确认的孤儿行 user_id
```

---

## Step 6：通知用户重新登录

告知用户：

> 「已帮你把数据标记好了，请在任意设备重新用邮箱登录一次（退出账号后重新输入验证码登录），数据会自动合并进来，刷新页面就能看到。」

系统会在用户 OTP 登录时自动执行合并，合并完成后 `pending_bind_email` 会被自动清空。

---

## Step 7（可选）：验证合并结果

用户登录后，查询确认数据是否已合并：

```sql
-- 验证合并后 UID_A 的数据
SELECT
  user_id,
  user_email,
  updated_at,
  jsonb_array_length(COALESCE(completed_tasks_full, '[]'::jsonb)) AS full_task_count,
  (SELECT string_agg(k, '、') FROM jsonb_each(COALESCE(data->'spirits', '{}'::jsonb)) kv(k,v)
   WHERE (v->>'obtained')::boolean = true) AS obtained_names
FROM user_data
WHERE user_id = '这里填uid_a';
```

与用户反馈对比，确认缺失数据已恢复。

---

## 注意事项

| 情况 | 处理方式 |
|---|---|
| 孤儿行数据是 UID_A 的子集（都有） | 合并后无差异，不影响用户数据 |
| 孤儿行有 UID_A 没有的数据 | 合并后 UID_A 会补入，用户数据增加 ✅ |
| 找不到孤儿行（device_id 对不上） | 数据可能已在历史操作中被覆盖，无法恢复，如实告知用户 |
| 用户确认孤儿行数据不是自己的 | 不要操作，可能是误匹配，换其他方式继续排查 |
| 同一邮箱有多个孤儿行 | 每个孤儿行都打上 email 标记，下次登录会全部合并 |

---

## 快速排查清单

```
□ 拿到用户邮箱
□ Step 1：找到 uid_a
□ Step 2：确认 uid_a 当前数据缺什么
□ Step 3：用 device_id 或时间范围找孤儿行
□ Step 4：和用户核对孤儿行数据，用户确认
□ Step 5：UPDATE 补回 user_email + pending_bind_email
□ Step 6：通知用户重新 OTP 登录
□ Step 7（可选）：查询验证合并结果
```
