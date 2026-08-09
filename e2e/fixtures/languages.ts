import type { Page } from '@playwright/test';

/**
 * The words X and YouTube put on the page in each language, and nothing else.
 *
 * These are translations written for this test, not copies taken from the live pages — the
 * repository has no account on either platform to read them from. So what a run here proves is
 * that the engine reaches its target through structure and a vocabulary lookup rather than
 * through an English string: a hard-coded `'Delete'`, a case-sensitive compare or an RTL
 * assumption fails. It does not prove our word lists match what X and YouTube actually ship.
 */
export interface SiteLanguage {
	id: string;
	/** The entry in X's post menu, and the button in Google's confirmation sheet. */
	delete: string;
	/** YouTube's overflow entry on a liked video. */
	removeFromLiked: string;
	/** Translated labels the engine must not depend on — it has structure for these. */
	actionMenu: string;
	deleteActivity: string;
	rtl?: boolean;
}

export const SITE_LANGUAGES: SiteLanguage[] = [
	{
		id: 'de',
		delete: 'Löschen',
		removeFromLiked: 'Aus "Videos, die ich mag" entfernen',
		actionMenu: 'Weitere Aktionen',
		deleteActivity: 'Aktivitätseintrag löschen'
	},
	{
		id: 'es',
		delete: 'Eliminar',
		removeFromLiked: 'Quitar de "Vídeos que me gustan"',
		actionMenu: 'Menú de acciones',
		deleteActivity: 'Eliminar elemento de actividad'
	},
	{
		id: 'ja',
		delete: '削除',
		removeFromLiked: '「高く評価した動画」から削除',
		actionMenu: '操作メニュー',
		deleteActivity: 'アクティビティを削除'
	},
	{
		id: 'tr',
		delete: 'Sil',
		removeFromLiked: 'Beğenilen videolardan kaldır',
		actionMenu: 'İşlem menüsü',
		deleteActivity: 'Etkinlik öğesini sil'
	},
	{
		id: 'ar',
		delete: 'حذف',
		removeFromLiked: 'إزالة من "الفيديوهات التي أعجبتني"',
		actionMenu: 'قائمة الإجراءات',
		deleteActivity: 'حذف عنصر النشاط',
		rtl: true
	}
];

/**
 * Puts the loaded fixture into `language`.
 *
 * Every language-independent hook the real pages offer is deliberately taken away at the same
 * time — `data-id` on Google's confirm button, and both `aria-label`s — so the run has to get
 * there the way it would on a page nobody here can read.
 */
export async function localise(page: Page, language: SiteLanguage): Promise<void> {
	await page.evaluate((words) => {
		document.documentElement.lang = words.id;
		if (words.rtl) document.documentElement.dir = 'rtl';

		for (const span of document.querySelectorAll('div[role="menu"] span')) {
			span.textContent = words.delete;
		}
		for (const label of document.querySelectorAll('yt-formatted-string')) {
			label.textContent = words.removeFromLiked;
		}
		for (const button of document.querySelectorAll('ytd-menu-renderer button')) {
			button.setAttribute('aria-label', words.actionMenu);
		}
		for (const button of document.querySelectorAll('button[aria-label^="Delete activity item"]')) {
			button.setAttribute('aria-label', words.deleteActivity);
		}
		for (const confirm of document.querySelectorAll('div[role="button"][data-id]')) {
			confirm.removeAttribute('data-id');
			const label = confirm.querySelector('span.Crf1o');
			if (label) label.textContent = words.delete;
		}
	}, language);
}
