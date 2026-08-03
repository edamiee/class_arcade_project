# Penelope's Learning Arcade — Web

Hosted, multi-student version of the classroom quiz game: Damien (admin) manages content and launches sessions, students join with a code and their name, scores are tracked individually and by team. See the full design in the project plan at `../` (main repo, `.claude/plans` — the `Web Deployment` plan) for the reasoning behind these choices.

This is a from-scratch Next.js + Supabase app, not a port of the single-file `index.html` — it reuses that app's game logic/theme CSS/sound engine as source reference, ported into React.

## One-time setup (you do this part — I can't create third-party accounts for you)

1. **Create a free Supabase project**: go to [supabase.com](https://supabase.com), sign up, create a new project. No payment needed for development.
2. **Run the schema migration**: in the Supabase dashboard, open the SQL Editor, paste the contents of `supabase/migrations/0001_init.sql`, and run it. This creates all the tables and RLS policies.
3. **Get your API keys**: Project Settings → API. You'll need the Project URL, the `anon` public key, and the `service_role` secret key.
4. **Create your admin login**: Authentication → Users → Add user, create yourself an account (email + password). Copy that user's UUID.
5. **Mark yourself as admin**: back in the SQL Editor, run:
   ```sql
   insert into public.admins (id) values ('paste-your-user-uuid-here');
   ```
6. **Set up local environment variables**: copy `.env.local.example` to `.env.local` and fill in the values from steps 3–4. `.env.local` is gitignored — never commit real keys.
7. **Anthropic key (optional, for AI question generation)**: add your key as `ANTHROPIC_API_KEY` in the same `.env.local`. Server-only, never sent to the browser.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin login at `/admin`, student join flow at `/join`.

## Deploying

Not needed to develop/test locally — see the "Local development first" section of the project plan. When you're ready to go live, we'll walk through connecting this repo to Vercel and setting the same environment variables there.
