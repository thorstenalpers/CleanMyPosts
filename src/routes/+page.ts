import { redirect } from '@sveltejs/kit';

// The window opens on Settings; there is no dashboard for `/` to show.
export function load(): never {
	redirect(307, '/settings');
}
