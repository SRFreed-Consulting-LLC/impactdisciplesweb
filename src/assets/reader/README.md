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
| `dictation.jpg`     | An answer mid-dictation, mic in its recording state (2026-09-03) |
| `group-chat.jpg`    | An Impact Group chat |
| `messages.jpg`      | The in-app inbox |
| `store-v2.jpg`      | The store, post-redesign (2026-09-03) |
| `settings.jpg`      | Settings |
| `help.jpg`          | Contextual help |

## Replacing a file means a NEW filename

firebase.json serves every `.jpg`/`.mp4` under `assets/` as
`public, max-age=31536000, immutable`. Overwrite `store.jpg` in place and a
returning visitor keeps the old picture for a year. That is why the store
recapture is `store-v2.jpg` and the old `store.jpg` is gone, and why the
page_content doc has to be repointed (Firestore, dev AND prod) in the same
change - the file and the reference move together.

## The dictation still (was a clip until 2026-09-03)

The 10s `dictation.mp4` loop was retired: the page draws every row's media
in the same phone-shaped box, and the clip's aspect ratio letterboxed into
it with a grey block beneath the phone. A still fits the box exactly.

ONE THING IS SIMULATED, then as now. Headless Chrome has no microphone and
no route to the speech backend, so `window.SpeechRecognition` is replaced
with a stub emitting a scripted phrase the way the real engine emits
interim-then-final results. Everything else is genuine: the real
SpeechDictationService, the real mic button, the real composeDictation()
insertion into the real answer field, on a real lesson question ("Salvation
and Assurance", Romans 3:23 - the phrase answers it). Only the audio-to-text
engine is synthetic.

Things that cost time, if it is ever redone (the capture script lives in a
session scratchpad, not the repo - rebuild from these notes):

- SpeechDictationService subscribes with `addEventListener('result')`, NOT
  the `on*` properties. A stub has to be an EventTarget and dispatch real
  events, or the app never hears it.
- Wait for `.mic-button` with `state: 'attached'`, not visible, and not a
  fixed delay: the renderer keeps every tab pane in the DOM behind
  `[hidden]`, and on a cold start the tabs render well after
  domcontentloaded.
- The FIRST lesson of a book is an intro with no questions. Walk the lesson
  links until one has a textarea.
- The patron's saved theme is dark; `colorScheme: 'light'` does nothing
  because ThemeService applies the profile after sign-in. Strip
  `.dark-theme` off `<html>` with a MutationObserver - and observe
  `document` with `subtree`, because an init script runs before
  `documentElement` exists.
- The fields hold the patron's REAL saved answers. Empty every textarea
  through an `input` event before dictating. This is safe only because the
  lesson saves on Save or in-app prev/next and nothing else - never click
  either, and use `page.goto` (a hard navigation) to leave.
- Emit the JPEG at its final size: `devices['iPhone 14']` with
  `deviceScaleFactor: 560 / 390` and `type: 'jpeg', quality: 82` produces
  560x953 directly. There is no ffmpeg or Python on this machine to resize
  with afterwards.

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
