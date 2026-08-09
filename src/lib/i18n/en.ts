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
	'app.tagline': 'Deletes posts, likes and comments',

	'nav.overview': 'Overview',
	'nav.log': 'Log',
	'nav.assistant': 'Assistant',
	'nav.settings': 'Settings',
	'nav.info': 'Info',
	'nav.collapse': 'Collapse menu',
	'nav.expand': 'Expand menu',

	'header.toDark': 'Switch to dark mode',
	'header.toLight': 'Switch to light mode',
	'header.language': 'Language',

	'site.signedIn': 'Signed in',
	'site.signedOut': 'Not signed in',
	'site.signInHint': 'Sign in to {platform} in the browser beside this panel to enable cleaning.',

	'action.show': 'Show {label}',
	'action.delete': 'Delete all {label}',
	'action.deleteAll': 'Delete everything',
	'confirm.all.title': 'Delete everything on {platform}?',
	'confirm.all.description':
		'Emptied one after the other, on {platform}: {lists}. This cannot be undone.',
	'run.allDone': '{count} items deleted in total.',
	'run.allPartly': '{count} items deleted, {failed} lists failed.',
	'action.close': 'Close {platform} actions',
	'action.open': 'Open {platform} actions',

	'assistant.controls': 'Assistant settings',
	'assistant.close': 'Close the assistant',
	'assistant.effort': 'Effort',
	'assistant.effort.low': 'Brief',
	'assistant.effort.medium': 'Normal',
	'assistant.effort.high': 'Thorough',
	'assistant.model': 'Model',
	'assistant.model.default': 'Provider default',
	'assistant.panel.empty':
		'Ask for a plan for the page beside this — what to remove, and how one of them goes away.',
	'assistant.noSource.short': 'No source',

	'assistant.plan.save': 'Keep as action',
	'assistant.plan.name': 'Name this action',
	'assistant.plan.keep': 'Keep',
	'assistant.plan.saved': 'Saved — {label} is now in the actions',
	'panel.saved': 'Saved actions',
	'confirm.saved.description':
		'Runs {label}, a plan the assistant wrote against {platform} as it looked when you kept it. This cannot be undone.',
	'assistant.plan.count': 'Check first',
	'assistant.plan.run': 'Run once',
	'assistant.plan.matches': '{count} on this page match it',
	'assistant.plan.removed': '{count} removed',
	'assistant.plan.rejected': 'Not a plan — {reason}',
	'assistant.plan.noPlatform': 'Sign in to a platform to try this here',
	'assistant.plan.label': 'Assistant plan',

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
	'log.level.debug': 'Debug',
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
	'settings.showIntro': 'Show the info',
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
	'settings.assistant.off': 'Off',
	'settings.assistant.off.description':
		'The assistant is switched off and does not appear in the sidebar.',
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
	'assistant.placeholder.patch': 'The menu on my page says "Remove from Liked videos" instead',
	'assistant.placeholder.report':
		'Deleting likes stopped after three videos and the menu closed by itself',
	'assistant.placeholder': 'Why did 12 posts not get deleted?',
	'assistant.ask': 'Ask',
	'assistant.asking': 'Asking…',
	'assistant.noSource':
		'No source is set up yet. Pick one in the settings — Claude Code on this machine, or a provider key.',
	'assistant.openSettings': 'Open the settings',
	'assistant.sendsLog':
		'The question is sent together with the log and a description of the app. The log never contains post content, handles or cookies.',
	'assistant.clear': 'Clear',
	'assistant.troubleshooting': 'Troubleshooting',
	'assistant.troubleshooting.hint':
		'Most failures have a known cause and a known fix. The guide lists them — and this assistant is given the same list along with your log.',
	'assistant.preview.show': 'Show what is sent',
	'assistant.preview.hide': 'Hide what is sent',
	'assistant.preview.description':
		'The request, exactly as it would leave this machine. Nothing beyond this is added.',
	'assistant.preview.role': 'Instructions',
	'assistant.preview.app': 'About the app',
	'assistant.preview.fixes': 'Known failures and fixes',
	'assistant.preview.log': 'The log',
	'assistant.preview.question': 'Your question',
	'assistant.preview.noQuestion': 'Type a question above to see it here.',

	'settings.about': 'About',
	'settings.about.description':
		'Not affiliated with, endorsed by, or sponsored by X Corp. or Google LLC. X and YouTube are trademarks of their respective owners.',
	'settings.versionBuilt': 'Version {version}, built {date}',
	'settings.versionLoading': 'Loading version…',
	'settings.checkUpdates': 'Check for updates',
	'settings.noUpdates': 'No updates available.',
	'update.checking': 'Checking…',
	'update.available.title': 'Update available',
	'update.available.body':
		'Version {version} is ready to install. CleanMyPosts closes and reopens itself once it is done; anything running is stopped.',
	'update.install': 'Install and restart',
	'update.later': 'Not now',
	'update.downloading': 'Downloading update {version}',
	'update.downloadingPercent': 'Downloading update {version} — {percent}%',
	'update.failed': 'The update could not be installed: {message}',
	'update.checkFailed': 'Could not check for updates: {message}',
	'settings.github': 'Project on GitHub',
	'settings.reportBug': 'Report a bug',
	'settings.licenses': 'Third-party licenses',

	'info.title': 'Info',
	'info.subtitle': 'What this app is, where it came from, and what it is built on.',
	'info.app.title': 'CleanMyPosts',
	'info.app.body':
		'A Windows app that clears out what you have posted, liked and followed, one platform at a time. It works the way you would: it opens the page in a browser window and clicks through it, until there is nothing left to remove.',
	'info.developer': 'Developer',
	'info.version.title': 'This installation',
	'info.version.description': 'Updates are downloaded and installed by the app itself.',
	'info.links.title': 'Links',
	'info.links.description': 'All of it is open: the code, the issues, and what it is built on.',
	'info.github.description': 'The source, the releases, and the history behind them.',
	'info.reportBug.description':
		'Something did not get deleted, or got deleted twice? This is where it goes.',
	'info.licenses.description': 'The open-source libraries this app ships, and their terms.',
	'info.legal.title': 'Legal',
	'info.troubleshooting.description':
		'The failures that come up again and again, and what to do about each.',

	'settings.general': 'General',
	'settings.general.description':
		'Which pages the app offers. Hiding a platform does not sign you out of it.',
	'settings.notifications': 'Notifications',
	'settings.notifications.description':
		'A short message when a run ends. It fades by itself after a second.',
	'settings.autoConsent': 'Dismiss cookie banners',
	'settings.autoConsent.description':
		'Click consent banners away automatically, taking the rejecting button wherever the banner offers one.',
	'settings.actions': 'Saved actions',
	'settings.actions.description':
		'Plans the assistant wrote that you kept. Each one is a selector, so it stops working when the platform moves.',
	'settings.actions.empty':
		'Nothing kept yet. Ask the assistant for a plan and keep it from there.',
	'settings.actions.made': '{platform} · kept {date}',
	'settings.actions.moveUp': 'Move up',
	'settings.actions.moveDown': 'Move down',
	'settings.actions.rename': 'Rename',
	'settings.actions.plan': 'Plan',
	'overview.saved': 'Saved actions',
	'overview.saved.description': 'Plans you kept. One click runs it on its platform.',
	'settings.actions.forget': 'Forget',
	'settings.actions.forgetAll': 'Forget all',
	'settings.actions.forgetAll.confirmBody':
		'This throws away {count} saved actions. There is no getting one back — the answer it came from is gone and the page has moved on.',

	'settings.reset.title': 'Reset',
	'settings.reset.description': 'Puts every setting back to the way a fresh installation starts.',
	'settings.reset.action': 'Reset to defaults',
	'settings.reset.confirmBody':
		'Every setting goes back to its default, including the theme, the language and the assistant. Signed-in sessions and the log are not touched.',
	'settings.reset.done': 'Settings reset',
	'settings.debugLogging': 'Verbose logging',
	'settings.debugLogging.description':
		'Records what a platform page actually offered when a deletion could not find its way. Useful for a bug report, noisy otherwise.',
	'settings.persistSession': 'Keep me signed in',
	'settings.persistSession.description':
		'Keep the WebView2 cache and cookies between launches. Off throws them away at every start, so X and YouTube open signed out.',
	'settings.checkUpdatesOnStart': 'Look for updates at start-up',
	'settings.checkUpdatesOnStart.description':
		'Ask the release page for a newer version each time the app starts, and say so on the overview when there is one. Off means updates are only found when you press the button on the Info page.',
	'settings.automation': 'Automation',
	'settings.automation.description': 'How a run behaves, and what it clicks.',
	'settings.engine': 'Delete engine',
	'settings.engine.none': 'Built-in behaviour',
	'settings.engine.active': 'Your own script, {count} lines',
	'settings.engine.edit': 'Edit',
	'settings.engine.reset': 'Reset',
	'settings.engine.save': 'Save',
	'settings.engine.hint':
		'Runs in the platform page before each action. `window.__cmp.config` holds every selector and every word the engine looks for — change what your language or region needs. A broken script costs the run nothing: it is caught, logged, and the built-in behaviour goes on.',
	'settings.engine.placeholder': "window.__cmp.config.youtube.removeFromLikedText.push('…');",

	'assistant.report': 'Report a problem',
	'assistant.report.hint':
		'The assistant turns the log into a bug report. You read it, then GitHub opens with the form filled in — filing it stays your click, because an issue is public.',
	'assistant.report.open': 'Report on GitHub',
	'assistant.preview.report': 'Bug report',
	'assistant.mode': 'What this request is',
	'assistant.mode.question': 'Question',
	'assistant.patch': 'AI Repair (experimental)',
	'assistant.patch.hint':
		'When a run deletes nothing, the page is usually worded differently than the app expects. Describe what you see - the menu item, the button - and the assistant writes a small script. Saved, it runs inside the platform page before every deletion, so read it first.',
	'assistant.patch.apply': 'Save this fix',
	'assistant.patch.applied': 'Saved. The next run uses it.',
	'assistant.openInCli': 'Continue in Claude Code',
	'assistant.dismiss': 'Dismiss',

	'header.url': 'You are here',

	'log.column.time': 'Time',
	'log.column.level': 'Level',
	'log.column.message': 'Message',
	'log.sortBy': 'Sort by {column}',

	'assistant.preview.source': 'Where the code is',
	'assistant.preview.structure': 'The page right now',
	'assistant.preview.engine': 'How the engine does it',
	'assistant.preview.patch': 'The patching task'
} as const;

export type MessageKey = keyof typeof en;
