# Reader screenshots for /discipleship-library

Real captures from the live Reader (impactdisciples-library.web.app),
2026-08-26. iPhone 14 viewport via Playwright, then downsampled to 560px
wide (2x the 280px the page displays them at) and re-encoded as JPEG q82 -
the raw captures were ~1170px wide and 2.0MB total, four times more pixels
than the page can ever show.

| File | Screen |
|---|---|
| `hero-lesson.jpg`   | A lesson open - the hero shot |
| `library-shelf.jpg` | Your Library, grouped by series |
| `dictation.jpg`     | PLACEHOLDER - currently a copy of hero-lesson |
| `group-chat.jpg`    | An Impact Group chat |
| `messages.jpg`      | The in-app inbox |
| `store.jpg`         | The store |
| `settings.jpg`      | Settings |
| `help.jpg`          | Contextual help |

## Still to do

`dictation.jpg` is a stand-in. The dictation row wants a short muted loop
of an answer being spoken and transcribed - record with Playwright
`recordVideo` (webm) and convert to H.264 mp4 via `ffmpeg-static`
(`-crf 30`), save as `dictation.mp4`, then flip that feature's entry to
`image: 'assets/reader/dictation.mp4', isVideo: true`. The `<video>`
branch is already in the template.

## How these were captured

Groups and Messages were EMPTY on the real account, so a fictional group
(4 made-up members, chat, prayer requests) and two inbox messages were
created on prod, captured, and then DELETED - prod is back to zero groups.
If you need to redo this, the scripts took a `demoMarker` field so the
cleanup is a query, not a memory. Two things that mattered:

- The demo group MUST be `groupVisibility: 'invite-only'`, or
  `search_impact_groups` publishes it to impactdisciples.com/impact-groups.
- Add members straight into `discussionGroups/{id}/members`, not through
  the invite flow, so no mail is sent to the fictional addresses.

Books live at `librarySeries/{seriesId}/books/{bookId}` - NOT a top-level
`books` collection, which is empty. Licences are `licensedBookIds` /
`bookLicenses` on `libraryUsers/{email}`.
