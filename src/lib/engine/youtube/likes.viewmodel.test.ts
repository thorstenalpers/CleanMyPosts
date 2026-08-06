import { afterEach, describe, expect, it } from 'vitest';
import { youTubeLikesAction } from './likes';
import { siteConfig } from '../config';

/**
 * The markup YouTube actually serves for the liked-videos list, trimmed to the parts the
 * engine looks at. It uses the `*-view-model` components that replaced the `ytd-*`
 * renderers — the change that made the whole action find nothing at all.
 */
const LOCKUP = `
<div id="contents">
	<yt-lockup-view-model class="ytLockupViewModelWrapper">
		<div class="ytLockupViewModelHost">
			<yt-lockup-metadata-view-model class="ytLockupMetadataViewModelHost">
				<div class="ytLockupMetadataViewModelTextContainer">
					<h3 title="Moonlight Smooth Jazz"><a href="/watch?v=r6kRv57n7yE">Moonlight Smooth Jazz</a></h3>
				</div>
				<div class="ytLockupMetadataViewModelMenuButton">
					<button-view-model>
						<button aria-label="Mehr Aktionen"></button>
					</button-view-model>
				</div>
			</yt-lockup-metadata-view-model>
		</div>
	</yt-lockup-view-model>
</div>`;

describe('the liked-videos list on the view-model markup', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('finds an entry that the old renderer selectors miss entirely', () => {
		document.body.innerHTML = LOCKUP;

		expect(document.querySelector('ytd-playlist-video-renderer')).toBeNull();
		expect(youTubeLikesAction.isEmpty()).toBe(false);
	});

	it('reaches the menu button by class, not by its translated label', () => {
		document.body.innerHTML = LOCKUP;
		const item = document.querySelector<HTMLElement>(siteConfig.youtube.videoItem);

		const button = item?.querySelector<HTMLElement>(siteConfig.youtube.itemMenu);

		// The label here is German; the class is the same in every language.
		expect(button?.getAttribute('aria-label')).toBe('Mehr Aktionen');
	});

	it('is empty when the list holds nothing', () => {
		document.body.innerHTML = '<div id="contents"></div>';

		expect(youTubeLikesAction.isEmpty()).toBe(true);
	});

	it('still recognises the old playlist renderer', () => {
		document.body.innerHTML = '<ytd-playlist-video-renderer></ytd-playlist-video-renderer>';

		expect(youTubeLikesAction.isEmpty()).toBe(false);
	});

	it('skips a row the old renderer already marked as gone', () => {
		document.body.innerHTML =
			'<ytd-playlist-video-renderer is-dismissed></ytd-playlist-video-renderer>';

		expect(youTubeLikesAction.isEmpty()).toBe(true);
	});
});
