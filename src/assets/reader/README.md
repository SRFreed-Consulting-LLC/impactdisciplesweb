# Reader assets for /discipleship-library

Real captures from the live Reader (impactdisciples-library.web.app),
2026-08-26. iPhone 14 viewport via Playwright, stills downsampled to 560px
wide (2x the 280px the page displays them at) and re-encoded JPEG q82 - the
raw captures were ~1170px wide and 2.0MB total, four times more pixels than
the page can ever show.

| File | Screen |
|---|---|
| `hero-lesson.jpg`   | A lesson open - the hero shot |
| `library-shelf.jpg` | Your Library, grouped by series |
| `dictation.mp4`     | 10s muted loop: an answer being spoken into a lesson |
| `group-chat.jpg`    | An Impact Group chat |
| `messages.jpg`      | The in-app inbox |
| `store.jpg`         | The store |
| `settings.jpg`      | Settings |
| `help.jpg`          | Contextual help |

## The dictation clip

10s, H.264 baseline, muted, faststart, ~101KB, recorded from the real app on
the lesson "Being Rightly Related to You".

ONE THING IS SIMULATED. Headless Chrome has no microphone and no route to
the speech backend, so `window.SpeechRecognition` was replaced with a stub
emitting a scripted phrase the way the real engine emits interim-then-final
results. Everything else is genuine: the real SpeechDictationService, the
real mic button, the real composeDictation() insertion into the real answer
field, on a real lesson question. Only the audio-to-text engine is synthetic.
A phone recording of someone actually speaking would be better, and is the
right long-term replacement.

Two things that cost time when recording it, if it is ever redone:

- SpeechDictationService subscribes with `addEventListener('result')`, NOT
  the `on*` properties. A stub has to be an EventTarget and dispatch real
  events, or the app never hears it - the first attempt recorded a clip
  where the mic was tapped and nothing arrived.
- Wait for `.mic-button` rather than a fixed delay. On a cold start the
  lesson's tabs render well after domcontentloaded, and a fixed wait
  silently recorded a clip with no mic button in it at all.

## How the stills were captured

Groups and Messages were EMPTY on the real account, so a fictional group
(4 made-up members, chat, prayer requests) and two inbox messages were
created on prod, captured, and then DELETED - prod is back to zero groups.
The scripts wrote a `demoMarker` field so cleanup is a query, not a memory.
Two things that mattered:

- The demo group MUST be `groupVisibility: 'invite-only'`, or
  `search_impact_groups` publishes it to impactdisciples.com/impact-groups.
- Add members straight into `discussionGroups/{id}/members`, not through the
  invite flow, so no mail is sent to the fictional addresses.

Books live at `librarySeries/{seriesId}/books/{bookId}` - NOT a top-level
`books` collection, which is empty. Lessons are another level down, under
`units/{unitId}/lessons/{lessonId}`. Licences are `licensedBookIds` /
`bookLicenses` on `libraryUsers/{email}`.
