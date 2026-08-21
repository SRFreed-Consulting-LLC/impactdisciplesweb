import { Component } from '@angular/core';

// The site had no wildcard route at all (bucket A, web item 7): an unknown
// URL matched none of the lazy route groups and left the visitor on a blank
// page with the header and footer missing entirely - no message, no way
// back. Declared in AppModule rather than a lazy feature module on purpose:
// a 404 has to render for URLs whose first segment matches no module, so it
// cannot live behind one of the firstSegmentMatcher groups.
@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  standalone: false
})
export class NotFoundComponent {}
