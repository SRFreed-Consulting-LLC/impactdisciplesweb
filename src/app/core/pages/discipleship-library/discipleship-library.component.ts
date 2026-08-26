import { Component } from '@angular/core';

/** One functional area of the Reader app, as a row on the page. */
export interface ReaderFeature {
  /** Numbered chip, e.g. "01 · Library & Books". */
  index: string;
  name: string;
  headline: string;
  body: string;
  /** Bullet points under the body; kept short - three at most reads well. */
  points: string[];
  /** Asset path. Captured from the real Reader app, phone-shaped. */
  image: string;
  imageAlt: string;
  /** true = this row's media is a looping clip rather than a still. */
  isVideo?: boolean;
  /** Rows alternate; true puts the media on the right. */
  mediaRight?: boolean;
}

// Marketing page for the Impact Discipleship Library reader app
// (impactdisciples-library.web.app), linked from the home slider.
//
// The seven rows below mirror the reader's OWN functional areas - its route
// groups, not invented marketing categories - so the page cannot drift from
// what the app actually does: books, lessons, groups, messages, store,
// settings, help.
//
// Media is a still by default and a short muted loop where the motion IS the
// point (dictation writing an answer as it is spoken). Every asset is
// captured from the real app; nothing here is a mockup.
@Component({
  selector: 'app-discipleship-library',
  templateUrl: './discipleship-library.component.html',
  styleUrls: ['./discipleship-library.component.scss'],
  standalone: false
})
export class DiscipleshipLibraryComponent {
  /** Where every call to action on this page goes. */
  readonly readerUrl = 'https://impactdisciples-library.web.app';

  readonly features: ReaderFeature[] = [
    {
      index: '01',
      name: 'Library & Books',
      headline: 'Every title, one shelf.',
      body: 'Browse the whole Impact Discipleship Library, open any book, and pick up exactly where you left off — the app remembers your place.',
      points: ['The full library in one list', 'Continue reading from any device', 'Nothing to install'],
      image: 'assets/reader/library-shelf.jpg',
      imageAlt: 'The Impact Discipleship Library book shelf on a phone'
    },
    {
      index: '02',
      name: 'Reading & Lessons',
      headline: 'Read it, then answer it.',
      body: 'Lessons ask real questions and expect real answers. Type yours — or say it out loud and let voice dictation write it down for you.',
      points: ['Work at your own pace', 'Type or speak your answers', 'Your notes stay with the lesson'],
      // The motion IS the point here - a still cannot show text arriving as
      // it is spoken - so this row is the one video on the page.
      image: 'assets/reader/dictation.mp4',
      imageAlt: 'Speaking an answer into a lesson and watching it transcribe',
      isVideo: true,
      mediaRight: true
    },
    {
      index: '03',
      name: 'Impact Groups',
      headline: 'Nobody disciples alone.',
      body: 'See who is in your group, message the room, share prayer requests, and hand licences to new members as they join.',
      points: ['Group chat and prayer requests', 'Members, invites and licences', 'Everyone on the same lesson'],
      image: 'assets/reader/group-chat.jpg',
      imageAlt: 'An Impact Group chat and its prayer requests'
    },
    {
      index: '04',
      name: 'Messages',
      headline: 'Word from us, straight to you.',
      body: 'When a new book lands on your shelf or a new season of groups opens, it arrives in your inbox inside the app — not in an email you will never find again.',
      points: ['Announcements from Impact Ministries', 'Unread count on the app badge', 'Kept until you clear it'],
      image: 'assets/reader/messages.jpg',
      imageAlt: 'The in-app inbox showing announcements from Impact Ministries',
      mediaRight: true
    },
    {
      index: '05',
      name: 'Store',
      headline: 'The next book, right where you are reading.',
      body: 'Buy your next resource without leaving the app — it appears on your shelf the moment it is yours.',
      points: ['Buy in the app', 'Straight onto your shelf'],
      image: 'assets/reader/store.jpg',
      imageAlt: 'The in-app store showing available resources'
    },
    {
      index: '06',
      name: 'Settings & Account',
      headline: 'Your account, your way.',
      body: 'Your details, your preferences, and the way the app looks — all in one place, all yours to change.',
      points: ['Your profile and preferences', 'Light or dark, your call'],
      image: 'assets/reader/settings.jpg',
      imageAlt: 'The reader settings screen',
      mediaRight: true
    },
    {
      index: '07',
      name: 'Help',
      headline: 'Help that knows where you are.',
      body: 'Every area has its own help, written for the screen you are actually looking at — not one long manual you have to search.',
      points: ['Help per area, not one manual', 'Written in plain language'],
      image: 'assets/reader/help.jpg',
      imageAlt: 'The contextual help screen'
    }
  ];
}
