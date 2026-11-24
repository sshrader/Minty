# Minty Plays

Static site (`public/index.html`, all CSS inline) plus a tiny dependency-free Node server.

    npm start      # http://localhost:8787

The video and Shorts rows load from the channel automatically (`/api/videos`, `/api/shorts`; override the channel with `YT_CHANNEL_ID`).

Games I play (`/api/games`): the games and their Roblox ids are listed in `server/games.mjs`; the server pulls each game's icon and screenshot from Roblox's public API (nothing is copied into the repo). Add a game by adding a `place` (the number in its roblox.com/games URL) or `universe` id.

Subscriber count (`/api/channel`): set `YT_API_KEY` (a free YouTube Data API v3 key) for the exact, reliable number; without it the server reads the count from the channel page, which can break if YouTube changes it. The badge hides itself if no count is available.

Edit the placeholders in `public/index.html`: YouTube link (`youtube.com/@Mintyplays8`), video cards, game cards, upload days and the contact email.

## Railway
New service from this repo, no build step, start command `npm start`, health check `/api/health`.
Add the custom domain (e.g. `minty.synxer.dev`) in Settings > Networking and create the CNAME record Railway shows.
