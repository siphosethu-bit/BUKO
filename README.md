# BUKO — restaurant website & admin dashboard

A Next.js restaurant site with a Supabase-backed admin dashboard for managing the menu, photography, homepage content, appearance and table reservations.

The public site works out of the box with sample content. The admin dashboard needs a Supabase project connected before anyone can sign in — this document covers that one-time setup.

## What admins can do once connected

- **Menu editor** (`/admin/menu`) — add, edit, reorder, archive and publish dishes and categories; upload dish photos; upload and version complete PDF menus; choose whether the public menu page shows the structured menu, the PDF, or both.
- **Media library** (`/admin/media`) — a central store for food photography, interior shots, and documents, with upload, replacement, and delete-reference warnings.
- **Website content** (`/admin/pages`) — edit the homepage hero, story, reservation panel copy and atmosphere section, with drafts, preview, and publish.
- **Appearance** (`/admin/appearance`, owners only) — colour palette, font and image-treatment presets with a live preview.
- **Reservations** (`/admin/reservations`) — review requests, confirm/cancel, add private staff notes.
- **Settings** (`/admin/settings`, owners only) — restaurant address, phone, email, opening hours, closures and booking rules.
- **Team** (`/admin/team`, owners only) — invite staff by email as Owner or Editor, disable access.
- **Activity** (`/admin/activity`) — a log of who changed what.

## 1. Prerequisites

- Node.js (already installed, since you're running this project)
- A free [Supabase](https://supabase.com) account

## 2. Create a Supabase project

1. Sign in at [supabase.com](https://supabase.com) and click **New project**.
2. Pick an organisation, name it (e.g. `buko`), set a database password (save it somewhere safe), choose a region, and create it.
3. Wait a minute or two for provisioning to finish.

## 3. Run the database migration

Run migrations in order: `001_initial.sql`, `002_reservation_tables.sql`, then `003_table_booking_guard.sql`. For an existing database, run only migrations that have not been applied. Migration 002 stores the chosen table; migration 003 prevents overlapping table requests and checks seating capacity, including staff updates.

The reservation floor-plan popup reads occupied tables for the chosen date and time. When online bookings are disabled, visitors can explore the room and select a preference; availability is not advertised as confirmed. Enable bookings and configure service hours under owner settings when the restaurant is ready.

1. In the Supabase dashboard, open **SQL Editor**.
2. Open [supabase/migrations/001_initial.sql](supabase/migrations/001_initial.sql) from this repo, copy its full contents, and paste it into the SQL editor.
3. Click **Run**. This creates every table, the row-level security policies, and the `restaurant-media` storage bucket used for uploaded photos and PDFs.

## 4. Get your API keys

In the Supabase dashboard, go to **Settings → API** and copy:

- **Project URL**
- **anon public** key
- **service_role** key (this one is secret — never put it in client-side code or commit it)

## 5. Configure environment variables

1. Copy `.env.example` to a new file named `.env.local` in the project root (this file is git-ignored and stays local to your machine).
2. Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=<your project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RATE_LIMIT_SECRET=<any long random string>
```

3. Restart the dev server (`npm run dev`) so it picks up the new environment variables.

The `RESEND_API_KEY`, `EMAIL_FROM`, and `STAFF_NOTIFICATION_EMAIL` variables are optional — see [Email notifications](#8-email-notifications-optional) below.

## 6. Create the first owner account

Staff invitations are sent *by* an existing owner, so the very first owner has to be created directly, once:

1. In the Supabase dashboard, go to **Authentication → Users → Add user**. Enter your email and a password, and tick **Auto Confirm User**.
2. Copy the new user's **UID** from the users list.
3. Back in the **SQL Editor**, run (replacing the placeholders):

```sql
insert into public.staff_profiles (id, name, email, role, active)
values ('paste-the-uid-here', 'Your Name', 'your@email.com', 'owner', true);
```

4. Go to `/admin/login` on your site and sign in with that email and password. You now have full owner access.

## 7. Invite additional staff

Once signed in as owner, open **Team** in the dashboard sidebar and send an invitation. This uses Supabase's built-in authentication email, which works out of the box for a small number of invites; for production use, configure a custom SMTP provider under **Authentication → Email Templates / SMTP Settings** in Supabase so invitations reliably reach real inboxes.

## 8. Email notifications (optional)

Reservation and contact-form emails use [Resend](https://resend.com). Set `RESEND_API_KEY`, `EMAIL_FROM`, and `STAFF_NOTIFICATION_EMAIL` in `.env.local` to enable them. Leave them blank and the system still saves reservations and enquiries correctly — it just reports that email notifications aren't configured, rather than pretending to send one.

## 9. Deployment

Deploy the app to [Vercel](https://vercel.com), and add the same environment variables from `.env.local` to the Vercel project settings, with `NEXT_PUBLIC_SITE_URL` set to your real domain (needed so staff invitation links point to the right place). The Supabase project you created stays as the hosted backend — no separate deployment step is needed for it.

## Local development

```
npm install
npm run dev       # start the dev server
npm run build     # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test        # unit tests
npm run test:e2e    # Playwright end-to-end tests
```
