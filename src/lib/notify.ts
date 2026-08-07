import { toast } from 'svelte-sonner';
import type { SettingsStore } from '$lib/stores/settings.svelte';

/**
 * Every toast in the app goes through here.
 *
 * Two reasons for the indirection: the notifications switch has to be able to silence all of
 * them from one place, and a result that flashes past is only acceptable because the log
 * keeps the same line — nothing is reported by a toast alone.
 */

/** Long enough to look away and come back to it. */
const DURATION_MS = 5000;
/** A failure gets a beat longer: it is the one message worth actually reading. */
const ERROR_DURATION_MS = 7000;

type Kind = 'success' | 'info' | 'error';

export function notify(store: SettingsStore, kind: Kind, message: string): void {
	if (!store.settings.notifications) return;
	toast[kind](message, { duration: kind === 'error' ? ERROR_DURATION_MS : DURATION_MS });
}
