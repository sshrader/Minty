# Minty Plays

Static site (`public/index.html`, all CSS inline) plus a tiny dependency-free Node server.

    npm start      # http://localhost:8787

The video and Shorts rows load from the channel automatically (`/api/videos`, `/api/shorts`; override the channel with `YT_CHANNEL_ID`).

Edit the placeholders in `public/index.html`: YouTube link (`youtube.com/@Mintyplays8`), video cards, game cards, upload days and the contact email.

## Railway
New service from this repo, no build step, start command `npm start`, health check `/api/health`.
Add the custom domain (e.g. `minty.synxer.dev`) in Settings > Networking and create the CNAME record Railway shows.
