# antelacus VPS deployment

## Current hosting split

- `project-antelacus`: self-host on this VPS with Docker + nginx
- `project-white`: keep on GitHub Pages at `white.antelacus.com`
- `project-wexler`: keep on GitHub Pages at `wexler.antelacus.com`

## Files added for VPS hosting

- `Dockerfile`: multi-stage Next.js production image
- `docker-compose.yml`: runs the app on `127.0.0.1:3002`
- `.env.example`: local runtime settings to copy into `.env`
- `deploy/nginx/www.antelacus.com.conf`: nginx vhost template

## Local deploy steps on the VPS

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Run `docker compose up -d --build` from the repo root.
3. Verify the app locally on `http://127.0.0.1:3002`.
4. Copy `deploy/nginx/www.antelacus.com.conf` into `/etc/nginx/sites-available/`.
5. Enable the nginx site, test with `nginx -t`, then reload nginx.
6. Point `www.antelacus.com` at this VPS and redirect `antelacus.com` to `www.antelacus.com`.

## Important implementation detail

The current site still reads content directly from `src/content` and `public/images/gallery` at runtime. The Docker image copies those directories on purpose so the existing file-based publishing flow keeps working after the move off Vercel.

## Next phase: dynamic publishing

After the VPS cutover is stable, the next refactor is to replace runtime file reads with a database-backed content layer so new posts can be published instantly without a rebuild.
