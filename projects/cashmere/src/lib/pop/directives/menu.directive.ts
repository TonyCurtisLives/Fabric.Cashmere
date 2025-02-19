import {Directive, HostBinding, ContentChildren, AfterContentInit, OnDestroy} from '@angular/core';
import type {QueryList} from '@angular/core';
import {HcPopoverAnchorDirective} from './popover-anchor.directive';
import {Subject, Subscription} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

/** The `hcMenu` directive provides a standard way of displaying a series of selectable elements in a popover. */
@Directive({
    selector: '[hcMenu]'
})
export class MenuDirective implements AfterContentInit, OnDestroy {
    @HostBinding('class.hc-menu-panel')
    _hostClass = true;

    @ContentChildren(HcPopoverAnchorDirective)
    _subMenus: QueryList<HcPopoverAnchorDirective>;

    private unsubscribe$ = new Subject<void>();

    ngAfterContentInit(): void {
        this.updateSubMenus();

        // Update submenus if they are added dynamically or after check
        this._subMenus.changes.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.updateSubMenus());
    }

    /** Rechecks the content for instances of `HcPopComponent` and inits them as submenus */
    updateSubMenus(): void {
        this._subMenus.forEach((anchor: HcPopoverAnchorDirective) => {
            anchor._hasSubmenu = true;
            // Subscribe to submenu open events so we can close any other submenus currently open
            anchor.popoverOpened.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
                this._subMenus.forEach((sub: HcPopoverAnchorDirective) => {
                    if (sub !== anchor && sub.attachedPopover.isOpen()) {
                        sub.attachedPopover._parentCloseBlock = true;
                        sub.attachedPopover._restoreFocusOverride = false;
                        sub.closePopover({}, true);
                        sub.attachedPopover._restoreFocusOverride = true;
                        const closeSub: Subscription = sub.attachedPopover.afterClose.subscribe(() => {
                            sub.attachedPopover._parentCloseBlock = false;
                            closeSub.unsubscribe();
                        });
                    }
                });
            });
        });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
