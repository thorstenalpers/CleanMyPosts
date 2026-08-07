import { afterEach, describe, expect, it } from 'vitest';
import { siteConfig, matchesAny } from '../config';

/**
 * The ⋮ menu of a liked video, exactly as YouTube renders it on a German account.
 *
 * Trimmed to what the engine reads — the wrapper chain, the six entries in their real order
 * and their real wording. The fourth sits inside `yt-download-list-item-view-model`, one
 * level deeper than the rest, which is the sort of thing a hand-written fixture never has.
 */
const MENU = `
<yt-contextual-sheet-layout class="ytContextualSheetLayoutHost">
	<div class="ytContextualSheetLayoutHeaderContainer"></div>
	<div class="ytContextualSheetLayoutContentContainer">
		<yt-list-view-model class="ytListViewModelHost" role="menu">
			${entry('In die Wiedergabeliste')}
			${entry('Zu „Später ansehen“ hinzufügen')}
			${entry('Zu Playlist hinzufügen')}
			<yt-download-list-item-view-model class="ytDownloadListItemViewModelHost">
				${entry('Herunterladen')}
			</yt-download-list-item-view-model>
			${entry('Teilen')}
			${entry('Aus "Videos, die ich mag" entfernen')}
		</yt-list-view-model>
	</div>
	<div class="ytContextualSheetLayoutFooterContainer"></div>
</yt-contextual-sheet-layout>`;

function entry(label: string): string {
	return `
	<yt-list-item-view-model class="ytListItemViewModelHost" role="menuitem">
		<div class="ytListItemViewModelLayoutWrapper ytListItemViewModelContainer ytListItemViewModelInPopup">
			<div class="ytListItemViewModelMainContainer">
				<button class="ytButtonOrAnchorHost ytListItemViewModelButtonOrAnchor ytListItemViewModelTextWrapper">
					<div><div class="ytListItemViewModelTitleWrapper">
						<span class="ytAttributedStringHost ytListItemViewModelTitle" role="text">${label}</span>
					</div></div>
				</button>
			</div>
		</div>
	</yt-list-item-view-model>`;
}

/** The same walk `clickRemoveFromLiked` does, over the same selectors. */
function findRemoveEntry(): { entry: Element; clickable: Element | null } | null {
	const popup = document.querySelector(siteConfig.youtube.likesPopup);
	if (!popup) return null;
	for (const item of popup.querySelectorAll(siteConfig.youtube.likesPopupItem)) {
		const title = item.querySelector('.ytListItemViewModelTitle');
		const text = title?.textContent ?? item.textContent ?? '';
		if (matchesAny(text, siteConfig.youtube.removeFromLikedText)) {
			return { entry: item, clickable: item.querySelector('button') };
		}
	}
	return null;
}

describe('the ⋮ menu of a liked video', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('is recognised as an open menu', () => {
		document.body.innerHTML = MENU;

		const popup = document.querySelector(siteConfig.youtube.likesPopup);
		expect(popup).not.toBeNull();
		expect(popup?.querySelector(siteConfig.youtube.likesPopupItem)).not.toBeNull();
	});

	it('yields the remove entry among five that must not be touched', () => {
		document.body.innerHTML = MENU;

		const found = findRemoveEntry();

		expect(found?.entry.textContent?.trim()).toBe('Aus "Videos, die ich mag" entfernen');
	});

	// The handler sits on an inner button; clicking the host element does nothing at all.
	it('offers the inner button as the thing to click', () => {
		document.body.innerHTML = MENU;

		const found = findRemoveEntry();

		expect(found?.clickable?.tagName).toBe('BUTTON');
		expect(found?.clickable?.className).toContain('ytListItemViewModelButtonOrAnchor');
	});

	it('picks none of the other entries', () => {
		document.body.innerHTML = MENU;

		for (const label of ['In die Wiedergabeliste', 'Zu Playlist hinzufügen', 'Herunterladen']) {
			expect(matchesAny(label, siteConfig.youtube.removeFromLikedText)).toBe(false);
		}
	});

	it('reads "Teilen" as no match, though it sits right beside the remove entry', () => {
		expect(matchesAny('Teilen', siteConfig.youtube.removeFromLikedText)).toBe(false);
	});
});
