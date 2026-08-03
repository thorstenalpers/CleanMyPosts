/**
 * The source catalogue. Every other language is typed against these keys, so a missing
 * translation is a compile error rather than a blank label at runtime.
 *
 * Brand names — CleanMyPosts, X, YouTube — are deliberately absent: they are the same in
 * every language, and a key for them would only invite someone to translate one.
 *
 * `{name}` placeholders are filled by `t`; the parts around them belong to the sentence, so
 * a translator can move them.
 */
export const en = {
	'nav.overview': 'Overview',
	'nav.log': 'Log',
	'nav.assistant': 'Assistant',
	'nav.settings': 'Settings',
	'nav.collapse': 'Collapse menu',
	'nav.expand': 'Expand menu',

	'site.signedIn': 'Signed in',
	'site.signedOut': 'Not signed in',
	'site.signInHint': 'Sign in to {platform} in the browser beside this panel to enable cleaning.',

	'action.show': 'Show {label}',
	'action.delete': 'Delete all {label}',
	'action.close': 'Close {platform} actions',

	'group.posts': 'Posts',
	'group.replies': 'Replies',
	'group.reposts': 'Reposts',
	'group.likes': 'Likes',
	'group.following': 'Following',
	'group.comments': 'Comments',
	'plural.posts': 'posts',
	'plural.replies': 'replies',
	'plural.reposts': 'reposts',
	'plural.likes': 'likes',
	'plural.following': 'followed accounts',
	'plural.comments': 'comments',
	'plural.likedVideos': 'liked videos',

	'confirm.title': 'Delete all {plural}?',
	'confirm.description':
		'This removes every one of your {plural} on {platform}. It cannot be undone.',
	'confirm.confirm': 'Delete',
	'confirm.cancel': 'Cancel',

	'run.deleting': 'Deleting {label}',
	'run.removedSoFar': '{count} removed so far',
	'run.stop': 'Stop',
	'run.none': 'No {plural} removed — nothing was found to delete.',
	'run.done': '{count} {plural} cleaned.',
	'run.failed': 'Deletion failed.',

	'overview.title': 'Overview',
	'overview.subtitle': 'What is connected, what can be cleaned, and what is running.',
	'overview.how.title': 'How this works',
	'overview.how.lead':
		'CleanMyPosts deletes your own posts, likes and comments by driving a real browser session — the same clicks you would make yourself, only without stopping.',
	'overview.how.automation.title': 'Browser automation, not an API.',
	'overview.how.automation.body':
		'The platform page is opened in a browser window inside this app and clicked through for you. No developer account, no OAuth, no API key — nothing that a platform can revoke or rate-limit differently than it does a person.',
	'overview.how.free.title': 'Free, and it stays free.',
	'overview.how.free.body':
		'There is no account, no subscription and no paid tier. Nothing is billed per deletion because nothing is billed at all.',
	'overview.how.private.title': 'Nothing leaves your machine.',
	'overview.how.private.body':
		'Your login lives in the browser profile Windows already keeps for this app, exactly as it would in a browser. Your posts are never uploaded, copied or stored — the only file written is this app’s own settings. Deletion is deliberately slow, with pauses you control, because that is what keeps it from looking like a bot.',
	'overview.how.dismiss': 'Got it — don’t show this again',
	'overview.kinds': '{count} kinds of content can be removed.',
	'overview.open': 'Open {platform}',
	'overview.now.title': 'Right now',
	'overview.now.running': 'Deleting {label} — {count} removed so far.',
	'overview.now.idle': 'Nothing is running.',
	'overview.now.confirmOn': 'Confirmation before deleting is on.',
	'overview.now.confirmOff': 'Confirmation before deleting is off.',
	'overview.now.pause': 'Pause between deletions: {count} ms.',

	'log.title': 'Log',
	'log.errors': '{count} errors',
	'log.warnings': '{count} warnings',
	'log.filter': 'Filter…',
	'log.filterLabel': 'Filter log messages',
	'log.levelLabel': 'Filter by level',
	'log.level.all': 'All',
	'log.level.info': 'Info',
	'log.level.warning': 'Warning',
	'log.level.error': 'Error',
	'log.clear': 'Clear',
	'log.empty': 'Nothing logged yet.',
	'log.noMatch': 'No entries match the filter.',
	'log.jump': 'Jump to latest',

	'settings.title': 'Settings',
	'settings.subtitle': 'Changes are saved as you make them.',
	'settings.invalid': 'Invalid settings value.',

	'settings.appearance': 'Appearance',
	'settings.appearance.description': 'How the app looks on this machine.',
	'settings.mode': 'Mode',
	'settings.mode.description': 'Follow Windows or pick a fixed mode.',
	'settings.mode.light': 'Light',
	'settings.mode.dark': 'Dark',
	'settings.mode.system': 'System',
	'settings.colour': 'Colour',
	'settings.colour.description': 'Only the accent changes. Red stays reserved for deletion.',
	'settings.language': 'Language',
	'settings.language.description': 'Follow Windows or pick a fixed language.',
	'settings.language.system': 'System',

	'settings.navigation': 'Navigation',
	'settings.navigation.description':
		'What the sidebar offers. Hiding a platform does not sign you out of it.',
	'settings.showX': 'Show X',
	'settings.showX.description': 'Posts, replies, reposts, likes, following.',
	'settings.showYouTube': 'Show YouTube',
	'settings.showYouTube.description': 'Comments and liked videos.',
	'settings.showIntro': 'Show the introduction',
	'settings.showIntro.description': 'The panel on the overview that explains how the app works.',
	'settings.showLog': 'Show log',
	'settings.showLog.description': 'A live log of every action, as its own page.',
	'settings.showAssistant': 'Show assistant',
	'settings.showAssistant.description': 'A page that answers questions about the app and the log.',

	'settings.safety': 'Safety',
	'settings.safety.description':
		'Deletions cannot be undone. These decide how loudly you are asked.',
	'settings.confirm': 'Confirm before deleting',
	'settings.confirm.description': 'Ask once per run.',

	'settings.timing': 'Timing',
	'settings.timing.description':
		'Raising these is always safe. Lowering them makes deletion faster but more likely to be flagged as automation.',
	'settings.timing.afterLoad': 'After a page loads',
	'settings.timing.afterLoad.description':
		'How long to let the page settle before the first deletion.',
	'settings.timing.betweenDeletes': 'Between deletions',
	'settings.timing.betweenDeletes.description':
		'Pause after each removed item. The main brake against automation detection.',
	'settings.timing.betweenRetries': 'Between retries',
	'settings.timing.betweenRetries.description':
		'Pause before retrying an item that did not disappear.',

	'settings.assistant': 'Assistant',
	'settings.assistant.description':
		'Where answers come from. The local binary sends nothing from this app; a hosted provider is the one thing here that puts data on the network.',
	'settings.assistant.source': 'Source',
	'settings.assistant.local': 'Claude Code on this machine',
	'settings.assistant.hosted': 'A hosted provider',
	'settings.assistant.cliPath': 'Path to the binary',
	'settings.assistant.cliPath.description':
		'Leave empty to look where Claude Code installs itself.',
	'settings.assistant.cliPath.placeholder': 'claude.exe',
	'settings.assistant.cliFound': 'Found: {version}',
	'settings.assistant.cliMissing': 'Not found on this machine.',
	'settings.assistant.provider': 'Provider',
	'settings.assistant.provider.description': 'Which hosted model answers, and its API key.',
	'settings.assistant.keys': 'API keys',
	'settings.assistant.keys.title': 'API keys',
	'settings.assistant.keys.description':
		'Keys go into the Windows Credential Manager, never into a file this app owns. A key cannot be read back — only replaced or forgotten.',
	'settings.assistant.keys.placeholder': 'Paste a key to store it',
	'settings.assistant.keys.stored': 'Stored',
	'settings.assistant.keys.saved': 'Saved',
	'settings.assistant.keys.none': 'No key',
	'settings.assistant.keys.free': 'Get a free key',
	'settings.assistant.keys.forget': 'Forget',
	'settings.assistant.keys.close': 'Done',

	'assistant.title': 'Assistant',
	'assistant.subtitle': 'Questions about what this app does, and about what the log says.',
	'assistant.placeholder': 'Why did 12 posts not get deleted?',
	'assistant.ask': 'Ask',
	'assistant.asking': 'Asking…',
	'assistant.noSource':
		'No source is set up yet. Pick one in the settings — Claude Code on this machine, or a provider key.',
	'assistant.openSettings': 'Open the settings',
	'assistant.sendsLog':
		'The question is sent together with the log and a description of the app. The log never contains post content, handles or cookies.',
	'assistant.clear': 'Clear',

	'settings.about': 'About',
	'settings.about.description':
		'Not affiliated with, endorsed by, or sponsored by X Corp. or Google LLC. X and YouTube are trademarks of their respective owners.',
	'settings.version': 'Version {version}',
	'settings.versionLoading': 'Loading version…',
	'settings.checkUpdates': 'Check for updates',
	'settings.noUpdates': 'No updates available.',
	'settings.github': 'Project on GitHub',
	'settings.reportBug': 'Report a bug',
	'settings.licenses': 'Third-party licenses'
} as const;

export type MessageKey = keyof typeof en;
