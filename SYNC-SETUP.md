# Sync Mise across your phone + computer

By default Mise saves only in the browser you're using. To share one kitchen
across every device, point it at a free cloud database (Supabase). No login,
no credit card. About 10 minutes, one time.

## 1. Make a Supabase project
1. Go to **supabase.com** → **Start your project** → sign in with GitHub or email.
2. Click **New project**. Pick any name, set a database password (you won't
   need it again — just save it somewhere), choose the region closest to you,
   and create it. Give it a minute to finish setting up.

## 2. Create the table (paste one snippet)
1. In your project, open **SQL Editor** in the left sidebar → **New query**.
2. Paste everything below and click **Run**. It builds the table and lets the
   app read and write it.

```sql
create table if not exists kitchen (id text primary key, data jsonb);
alter table kitchen enable row level security;
drop policy if exists "mise read" on kitchen;
drop policy if exists "mise insert" on kitchen;
drop policy if exists "mise update" on kitchen;
create policy "mise read"   on kitchen for select using (true);
create policy "mise insert" on kitchen for insert with check (true);
create policy "mise update" on kitchen for update using (true);
```

You should see "Success. No rows returned." That's correct.

## 3. Copy your two values
1. Left sidebar → **Settings** (gear) → **API**.
2. Copy **Project URL** and the **anon public** key (the long one labeled
   "anon" / "public" — NOT the "service_role" key).

## 4. Paste them into the app
1. Open **src/cloud.js** in the project folder (any text editor — even TextEdit).
2. Replace `PASTE_PROJECT_URL_HERE` with your Project URL.
3. Replace `PASTE_ANON_PUBLIC_KEY_HERE` with your anon public key.
4. Keep the quotes around each value. Save the file.

## 5. Install + run
From the `mise-app` folder in Terminal:

```bash
npm install      # picks up the new database library
npm run dev      # open the localhost link to test
```

If your existing pantry doesn't appear, that's expected the first time —
the app seeds a fresh copy into the cloud. From then on, every device that
loads the app shares it.

## 6. Put it online for your phone
```bash
npm run build
```

Drag the new **dist** folder onto **app.netlify.com/drop**. You get a public
link. Open it on your phone and your computer — both now read and write the
same kitchen. Add it to your phone's home screen (Share → Add to Home Screen)
and it behaves like an app.

## Good to know
- **It's last-save-wins, and not live.** Changes sync within a second of being
  made, but a device shows what was there when it loaded — pull down / refresh
  to grab the latest from the other device. Fine for one person; don't edit the
  same thing on both devices at the same second.
- **Privacy:** anyone with your Netlify link (and the app's key, which ships in
  the page) can read/edit the data. For a private grocery list at an unguessable
  URL that's a normal trade-off. If that ever matters, ask about adding a login.
- **It still works offline / unconfigured:** if Supabase is unreachable or you
  haven't filled in cloud.js, Mise falls back to saving on that device.
