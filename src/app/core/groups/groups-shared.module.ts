import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GroupCardComponent } from './components/group-card/group-card.component';
import { GroupStripComponent } from './components/group-strip/group-strip.component';

/**
 * The Impact Group pieces that appear OUTSIDE the finder itself - today the
 * store product page's "groups studying this book" strip.
 *
 * Separate from GroupsFeatureModule because a component may only be
 * declared once: the finder (lazy, `/impact-groups`) and the store (lazy,
 * `/product-details/:id`) are different modules and both need the card, so
 * neither can own its declaration.
 */
@NgModule({
  declarations: [GroupCardComponent, GroupStripComponent],
  imports: [CommonModule, RouterModule],
  exports: [GroupCardComponent, GroupStripComponent],
})
export class GroupsSharedModule {}
