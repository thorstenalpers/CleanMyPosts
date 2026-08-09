import { describe, expect, it } from 'vitest';
import { matchesAny, siteConfig } from './config';

/**
 * The urls no longer ask for English, because both platforms ignored the request and answered
 * in the account's language anyway. What the engine matches on has to cover those languages
 * itself, or a run on a German account finds a menu it cannot read.
 */
describe('the wordings the engine looks for', () => {
	const DELETE = {
		English: 'Delete',
		German: 'Löschen',
		French: 'Supprimer',
		Spanish: 'Eliminar',
		Italian: 'Elimina',
		Portuguese: 'Excluir',
		Dutch: 'Verwijderen',
		Polish: 'Usuń',
		Russian: 'Удалить',
		Japanese: '削除',
		Chinese: '删除',
		Arabic: 'حذف',
		Turkish: 'Sil'
	};

	it("reads X's delete entry in every language the app offers", () => {
		for (const [language, word] of Object.entries(DELETE)) {
			expect(matchesAny(word, siteConfig.x.deleteMenuText), language).toBe(true);
		}
	});

	it("reads YouTube's delete confirmation in the same ones", () => {
		for (const [language, word] of Object.entries(DELETE)) {
			expect(matchesAny(word, siteConfig.youtube.confirmDeleteText), language).toBe(true);
		}
	});

	// A menu entry is a sentence, not a word: "Delete post", "Beitrag löschen".
	it('finds the word inside the sentence around it, whatever its case', () => {
		expect(matchesAny('Delete post', siteConfig.x.deleteMenuText)).toBe(true);
		expect(matchesAny('Beitrag LÖSCHEN', siteConfig.x.deleteMenuText)).toBe(true);
		expect(matchesAny('Supprimer le post', siteConfig.x.deleteMenuText)).toBe(true);
	});

	// The one entry that must never match: it sits in the same menu as the delete one.
	it('does not read a different entry as the delete entry', () => {
		for (const other of [
			'Pin to your profile',
			'Anheften',
			'Bearbeiten',
			'View post engagements'
		]) {
			expect(matchesAny(other, siteConfig.x.deleteMenuText), other).toBe(false);
		}
	});
});
