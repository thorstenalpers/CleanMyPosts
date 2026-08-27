/**
 * The pages each action runs on, as the settings show and override them. `{user}` stands for
 * the signed-in handle. Kept in step by hand with `target_url` in
 * `src-tauri/src/commands/site.rs`, the same way the extension's copy is — the host decides,
 * this is what the settings page can print beside the field.
 */
export const SITE_URL_DEFAULTS: Record<string, string> = {
	'x.posts': 'https://x.com/search?q=from%3A{user}&src=typed_query',
	'x.replies': 'https://x.com/{user}/with_replies',
	'x.reposts': 'https://x.com/{user}/reposts',
	'x.likes': 'https://x.com/{user}/likes',
	'x.following': 'https://x.com/{user}/following',
	'youtube.comments': 'https://myactivity.google.com/page?page=youtube_comments',
	'youtube.likes': 'https://myactivity.google.com/page?page=youtube_likes'
};
