# Reader screenshots for /discipleship-library

Every file here is a **1×1 transparent placeholder**. They exist so the page
builds and lays out; they are NOT the real assets.

Replace with real captures from the Reader app (impactdisciples-library.web.app):

| File | Screen |
|---|---|
| `hero-lesson.png`   | A lesson open — the hero shot |
| `library-shelf.png` | The books list |
| `group-chat.png`    | An Impact Group chat with prayer requests |
| `messages.png`      | A direct message conversation |
| `store.png`         | The in-app store |
| `settings.png`      | Settings |
| `help.png`          | Contextual help |
| `dictation.mp4`     | Muted loop: speaking an answer, watching it transcribe |

Capture notes (from the marketing-deck pipeline):
- Playwright with `devices['iPhone 14']` against the real app, real account.
- Needs an account that already has a licensed book — a fresh signup shows an
  empty shelf. `scripts/lib/session.js` in the reader repo says outright there
  is no way to self-provision one.
- Do NOT ship screenshots containing real patron names, emails or messages.
- `dictation.mp4`: Playwright `recordVideo` (webm) → H.264 mp4 via
  `ffmpeg-static`, `-crf 30`, muted.
