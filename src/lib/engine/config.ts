/**
 * Everything the engine looks for, in one editable place.
 *
 * The selectors that carry a `data-testid` are the same in every language; the ones that
 * carry a label or a menu word are not, and neither are the regional variants of a platform
 * that ship a different DOM altogether. Those are the reason this object exists: the host
 * evaluates the user's own script against `window.__cmp.config` before a run, so a wording
 * this app has never seen can be added without a new release.
 *
 * It is a plain mutable object on purpose. A patch is one assignment or one `push`, which is
 * something a user — or the assistant writing it for them — can get right in one line.
 */

/**
 * "Delete", in every language the app offers, as a lower-cased substring.
 *
 * Spread into each field that needs it rather than shared by reference: a patch is one
 * `push`, and a shared array would have that push land on three unrelated menus at once.
 */
const DELETE_WORDS = [
	'delete',
	'löschen',
	'supprimer',
	'eliminar',
	'borrar',
	'elimina',
	'excluir',
	'verwijderen',
	'usuń',
	'удалить',
	'削除',
	'删除',
	'حذف',
	'हटाएं',
	'sil'
];

export interface SiteConfig {
	/** Whether cookie banners are clicked away. The host writes the user's setting here. */
	autoConsent: boolean;
	x: {
		/** The profile link in the nav rail. Its href carries the handle every X url needs. */
		profileLink: string;
		/** Second source for the handle: the account button, whose text holds `@handle`. */
		accountSwitcher: string;
		/** What only a signed-out x.com renders. Separates "signed out" from "not sure yet". */
		signedOut: string;
		/** The ⌄ on the user's own post, on the profile timeline. */
		caret: string;
		/** The ⌄ on a single article, used while deleting replies. */
		articleCaret: string;
		/** One post in the timeline. Also what "the list is empty" is decided on. */
		article: string;
		/** The menu that ⌄ opens, and one entry in it. */
		menu: string;
		menuItem: string;
		/** The red "Delete" in the post menu, matched by text where the colour is not enough. */
		/**
		 * The wording of the menu entry that deletes, in every language the app offers.
		 *
		 * Multilingual rather than English-only because the url no longer asks for English: the
		 * platforms mostly ignored that request anyway and answered in the account's language,
		 * which left the one English word here matching nothing. Matched case-insensitively as
		 * a substring, so a short stem covers the sentence around it.
		 */
		deleteMenuText: string[];
		confirm: string;
		unretweet: string;
		unretweetConfirm: string;
		unlike: string;
		unfollow: string;
	};
	youtube: {
		/** One entry in the liked-videos list, old renderers and new view models alike. */
		videoItem: string;
		/** The ⋮ on such an entry. Matched by class, which survives a language change. */
		itemMenu: string;
		/** Anything only a signed-in page renders, across YouTube and My Activity. */
		signedIn: string;
		/** A real sign-in call to action — not merely a link pointing at the account pages. */
		signedOut: string;
		/** My Activity's per-item delete button, narrowed by `deleteActivityText`. */
		deleteActivity: string;
		/** The wording on that button's `aria-label`. */
		deleteActivityText: string[];
		/** The popup the ⋮ opens on a liked video, in either of its shapes. */
		likesPopup: string;
		/** One entry inside that popup. */
		likesPopupItem: string;
		/** The survey/feedback dialog that steals the next click. */
		closeDialog: string;
		/** My Activity's confirmation sheet: the button, and the label inside it to read. */
		confirmButton: string;
		confirmLabel: string;
		/** "Delete" in that sheet. */
		confirmDeleteText: string[];
		/** "Show more" under a My Activity day group, narrowed by `loadMoreText`. */
		loadMore: string;
		/** The wording on it. */
		loadMoreText: string[];
		/** Fragments of the "Remove from Liked videos" menu item, lower-cased. */
		removeFromLikedText: string[];
	};
}

export const siteConfig: SiteConfig = {
	autoConsent: true,
	x: {
		profileLink: 'a[data-testid="AppTabBar_Profile_Link"]',
		accountSwitcher: '[data-testid="SideNav_AccountSwitcher_Button"]',
		signedOut:
			'[data-testid="loginButton"], [data-testid="signupButton"], [data-testid="LoginForm_Login_Button"]',
		caret: "div[data-testid='primaryColumn'] section button[data-testid='caret']",
		// By test id, with the English label only as a last resort: `aria-label` is translated,
		// so matching it alone meant this never worked on a non-English account.
		articleCaret: 'button[data-testid="caret"], button[aria-label="More"]',
		article: 'article',
		menu: '[role="menu"]',
		menuItem: '[role="menuitem"]',
		deleteMenuText: [...DELETE_WORDS],
		confirm: "button[data-testid='confirmationSheetConfirm']",
		unretweet: 'button[data-testid="unretweet"]',
		unretweetConfirm: 'div[role="menuitem"][data-testid="unretweetConfirm"]',
		unlike: 'button[data-testid="unlike"]',
		unfollow: 'button[data-testid$="-unfollow"]'
	},
	youtube: {
		// YouTube is midway through replacing `ytd-*` renderers with `*-view-model` components;
		// the liked list is already on the new ones. Both are listed, newest first, because a
		// user on either build has to be served.
		videoItem: [
			'yt-lockup-view-model',
			'ytd-playlist-video-renderer:not([is-dismissed])',
			'ytd-rich-item-renderer:not([is-dismissed])',
			'ytd-compact-video-renderer:not([is-dismissed])'
		].join(', '),
		// A class, not the `aria-label`: the label is translated ("Mehr Aktionen"), the class
		// is not.
		itemMenu: [
			'.ytLockupMetadataViewModelMenuButton button',
			'ytd-menu-renderer yt-icon-button#button button',
			'ytd-menu-renderer button#button',
			'ytd-menu-renderer button'
		].join(', '),
		signedIn: [
			'button#avatar-btn img[src]',
			'yt-img-shadow#avatar img[src]',
			'div[role="listitem"]',
			'button[aria-label^="Delete activity item"]',
			'[data-activity-collection-name]',
			'ytd-playlist-video-renderer',
			'yt-lockup-view-model'
		].join(', '),
		// Anchored to YouTube's own sign-in button. A bare `accounts.google.com` link is on
		// every Google page, signed in or not — matching it read My Activity as signed out and
		// disabled the whole panel the moment a user opened their comments.
		signedOut: 'ytd-button-renderer a[href*="accounts.google.com"], a[href*="ServiceLogin"]',
		// Google's `jscontroller`/`jsname`/`jslog` *values* are Closure output and rotate with a
		// deployment; a selector pinned to one of them dies on a Tuesday for no visible reason.
		// The attribute being *present* is what survives, so the structure anchors here and the
		// wording in `deleteActivityText` does the narrowing.
		deleteActivity: 'div[role="listitem"] button[aria-label], div[jscontroller] button[aria-label]',
		deleteActivityText: [...DELETE_WORDS],
		likesPopup:
			'.ytContextualSheetLayoutContentContainer, yt-list-view-model, ytd-menu-popup-renderer',
		likesPopupItem: 'yt-list-item-view-model, ytd-menu-service-item-renderer, [role="menuitem"]',
		closeDialog: 'button[aria-label="Close this dialog"]',
		confirmButton: 'div[role="button"]',
		// Was `span.Crf1o`. That class is generated and changed under us; the label is simply the
		// text inside the button, and the button itself is the fallback when there is no span.
		confirmLabel: 'span',
		confirmDeleteText: [...DELETE_WORDS],
		loadMore: 'button[jsname], div[role="button"][jsname], button[jsaction]',
		loadMoreText: [
			'show more',
			'load more',
			'mehr anzeigen',
			'afficher plus',
			'mostrar más',
			'mostra altro',
			'mostrar mais',
			'meer weergeven',
			'pokaż więcej',
			'показать больше',
			'もっと見る',
			'显示更多',
			'عرض المزيد',
			'और दिखाएं',
			'daha fazla göster'
		],
		removeFromLikedText: [
			'remove from liked',
			'remove from "liked',
			'aus "videos, die ich mag" entfernen',
			'videos, die ich mag',
			'entfernen',
			'supprimer de',
			"j'aime",
			'retirer de',
			'eliminar de',
			'me gusta',
			'quitar de',
			'rimuovi da',
			'mi piace',
			'remover de',
			'gostei',
			'verwijderen uit',
			'usuń z',
			'удалить из',
			'高く評価した動画',
			'我喜欢的视频',
			'أعجبتني',
			'पसंद किए गए वीडियो',
			'beğenilen videolardan'
		]
	}
};

/** True if `text` contains any of `patterns`, comparing lower-cased. */
export function matchesAny(text: string, patterns: string[]): boolean {
	const lower = text.toLowerCase();
	return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}
