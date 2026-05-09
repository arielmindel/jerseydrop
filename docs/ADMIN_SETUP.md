# JerseyDrop Admin Panel — Manual Setup Steps

The code is fully deployed. Three things require **manual** action by Ariel
because secrets / Auth-system records can't be MCP-automated.

---

## 1. Get the Service-Role Key (server-only secret)

The MCP doesn't expose this for security reasons. Grab it from Supabase:

1. Open https://supabase.com/dashboard/project/eghyxmkrkfwthldgpaly/settings/api-keys
2. Find the section **Service Role Secret** → click "Reveal"
3. Copy the JWT (starts with `eyJ...`)

Save it in **two places**:

### Local (`.env.local`)
Replace the placeholder:
```
SUPABASE_SERVICE_ROLE_KEY=PASTE_SERVICE_ROLE_KEY_HERE
```
with the real value.

### Vercel (production)
1. https://vercel.com/arielmindel/jerseydrop/settings/environment-variables
2. Add three env vars (Production + Preview + Development):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://eghyxmkrkfwthldgpaly.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs…Akzc` (the legacy anon JWT, see `.env.local`) |
| `SUPABASE_SERVICE_ROLE_KEY` | the secret JWT you just copied |

3. Click "Save". Vercel will redeploy automatically.

After the redeploy, `/admin` will stop returning 500 and start redirecting
to `/admin/login` (no session = unauthorised, by design).

---

## 2. Create Auth Users

Each admin needs a real Supabase Auth account.

1. https://supabase.com/dashboard/project/eghyxmkrkfwthldgpaly/auth/users
2. Click **Add user → Create new user**.
3. Add **Ariel**:
   - Email: `arielmindel10@gmail.com`
   - Password: pick a strong temp password (you'll change it on first login)
   - Email Confirm: ✅ leave checked
4. Add **Partner**:
   - Email: `partner@jerseydrop.co.il`
   - Password: pick a strong temp password
   - Email Confirm: ✅
5. After each is created, click the user → **copy the UUID** from the URL or the user details panel.

---

## 3. Insert Admin Records

Open https://supabase.com/dashboard/project/eghyxmkrkfwthldgpaly/sql/new and run:

```sql
insert into admin_users (id, email, full_name) values
  ('<ARIEL-UUID-HERE>',   'arielmindel10@gmail.com',  'Ariel Mindel'),
  ('<PARTNER-UUID-HERE>', 'partner@jerseydrop.co.il', 'Partner');
```

Replace the two UUIDs with the values from step 2.

---

## 4. Verify

1. https://jerseydrop.vercel.app/admin
   → should redirect to `/admin/login` (no session).
2. Try a wrong password → "אימייל או סיסמה שגויים".
3. Log in as Ariel → dashboard loads with stats + (empty) orders table.
4. Log out → returns to `/admin/login`.
5. https://jerseydrop.vercel.app/checkout → place a test order with at
   least one cart item.
6. Reload `/admin` → the new order appears in the table.
7. Change its status with the inline `<select>` → reload, status persists.
8. Tick its checkbox → bulk-actions bar appears → "ייצא לוואטסאפ" →
   modal opens with the supplier message → "העתק טקסט" → check clipboard.
9. https://jerseydrop.vercel.app/robots.txt → confirms
   `Disallow: /admin` is listed.

If any step fails, check the **Vercel Functions log** for `[orders]`
errors and the **Supabase log** for RLS rejections.

---

## Status enum (what each value means in the order pipeline)

| Value | Hebrew | Meaning |
|---|---|---|
| `awaiting_batch` | ממתין לאצווה | Customer paid, we haven't ordered from supplier yet |
| `ordered_from_supplier` | הוזמן מהספק | Sent the WhatsApp batch to the supplier |
| `arrived_in_country` | הגיע ארצה | Shipment landed in Israel customs |
| `shipped_to_customer` | נשלח ללקוח | Customer has tracking number |
| `completed` | הושלם | Customer received it, no open issues |

Status is a free-form `text` column in Postgres — adding new values later
is just an enum entry in `STATUS_LABELS` (`src/lib/supabase/types.ts`)
and an `OrderStatus` union update.
