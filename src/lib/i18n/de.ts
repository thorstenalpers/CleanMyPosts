import type { MessageKey } from './en';

/** Typed against `MessageKey`, so a key added in English fails to compile until it lands here. */
export const de: Record<MessageKey, string> = {
	'nav.overview': 'Übersicht',
	'nav.log': 'Protokoll',
	'nav.settings': 'Einstellungen',
	'nav.collapse': 'Menü einklappen',
	'nav.expand': 'Menü ausklappen',

	'site.signedIn': 'Angemeldet',
	'site.signedOut': 'Nicht angemeldet',
	'site.signInHint':
		'Melde dich im Browser neben dieser Leiste bei {platform} an, um aufräumen zu können.',

	'action.show': '{label} anzeigen',
	'action.delete': 'Alle {label} löschen',
	'action.close': 'Aktionen für {platform} schließen',

	'group.posts': 'Beiträge',
	'group.replies': 'Antworten',
	'group.reposts': 'Reposts',
	'group.likes': 'Likes',
	'group.following': 'Gefolgt',
	'group.comments': 'Kommentare',
	'plural.posts': 'Beiträge',
	'plural.replies': 'Antworten',
	'plural.reposts': 'Reposts',
	'plural.likes': 'Likes',
	'plural.following': 'gefolgte Konten',
	'plural.comments': 'Kommentare',
	'plural.likedVideos': 'gelikte Videos',

	'confirm.title': 'Alle {plural} löschen?',
	'confirm.description':
		'Das entfernt jeden einzelnen deiner {plural} auf {platform}. Es lässt sich nicht rückgängig machen.',
	'confirm.confirm': 'Löschen',
	'confirm.cancel': 'Abbrechen',

	'run.deleting': 'Lösche {label}',
	'run.removedSoFar': '{count} bisher entfernt',
	'run.stop': 'Stopp',
	'run.none': 'Keine {plural} entfernt — es war nichts zu löschen da.',
	'run.done': '{count} {plural} aufgeräumt.',
	'run.failed': 'Löschen fehlgeschlagen.',

	'overview.title': 'Übersicht',
	'overview.subtitle': 'Was verbunden ist, was aufgeräumt werden kann und was gerade läuft.',
	'overview.how.title': 'So funktioniert das',
	'overview.how.lead':
		'CleanMyPosts löscht deine eigenen Beiträge, Likes und Kommentare, indem es eine echte Browser-Sitzung steuert — dieselben Klicks, die du selbst machen würdest, nur ohne aufzuhören.',
	'overview.how.automation.title': 'Browser-Automatisierung, keine API.',
	'overview.how.automation.body':
		'Die Plattformseite wird in einem Browser-Fenster innerhalb dieser App geöffnet und für dich durchgeklickt. Kein Entwicklerkonto, kein OAuth, kein API-Key — nichts, was eine Plattform anders entziehen oder drosseln könnte als bei einem Menschen.',
	'overview.how.free.title': 'Kostenlos, und das bleibt so.',
	'overview.how.free.body':
		'Es gibt kein Konto, kein Abo und keine bezahlte Stufe. Nichts wird pro Löschung abgerechnet, weil überhaupt nichts abgerechnet wird.',
	'overview.how.private.title': 'Nichts verlässt deinen Rechner.',
	'overview.how.private.body':
		'Deine Anmeldung liegt in dem Browser-Profil, das Windows für diese App ohnehin führt — genau wie in einem Browser. Deine Beiträge werden nie hochgeladen, kopiert oder gespeichert; die einzige Datei, die geschrieben wird, sind die Einstellungen dieser App. Das Löschen ist bewusst langsam, mit Pausen, die du bestimmst, denn genau das lässt es nicht wie einen Bot aussehen.',
	'overview.how.dismiss': 'Verstanden — nicht mehr anzeigen',
	'overview.kinds': '{count} Arten von Inhalten lassen sich entfernen.',
	'overview.open': '{platform} öffnen',
	'overview.now.title': 'Gerade eben',
	'overview.now.running': 'Lösche {label} — {count} bisher entfernt.',
	'overview.now.idle': 'Es läuft nichts.',
	'overview.now.confirmOn': 'Nachfrage vor dem Löschen ist an.',
	'overview.now.confirmOff': 'Nachfrage vor dem Löschen ist aus.',
	'overview.now.pause': 'Pause zwischen Löschungen: {count} ms.',

	'log.title': 'Protokoll',
	'log.errors': '{count} Fehler',
	'log.warnings': '{count} Warnungen',
	'log.filter': 'Filtern…',
	'log.filterLabel': 'Protokollmeldungen filtern',
	'log.levelLabel': 'Nach Stufe filtern',
	'log.level.all': 'Alle',
	'log.level.info': 'Info',
	'log.level.warning': 'Warnung',
	'log.level.error': 'Fehler',
	'log.clear': 'Leeren',
	'log.empty': 'Noch nichts protokolliert.',
	'log.noMatch': 'Keine Einträge passen zum Filter.',
	'log.jump': 'Zum Neuesten springen',

	'settings.title': 'Einstellungen',
	'settings.subtitle': 'Änderungen werden sofort gespeichert.',
	'settings.invalid': 'Ungültiger Wert.',

	'settings.appearance': 'Darstellung',
	'settings.appearance.description': 'Wie die App auf diesem Rechner aussieht.',
	'settings.mode': 'Modus',
	'settings.mode.description': 'Windows folgen oder fest wählen.',
	'settings.mode.light': 'Hell',
	'settings.mode.dark': 'Dunkel',
	'settings.mode.system': 'System',
	'settings.colour': 'Farbe',
	'settings.colour.description': 'Nur der Akzent ändert sich. Rot bleibt dem Löschen vorbehalten.',
	'settings.language': 'Sprache',
	'settings.language.description': 'Windows folgen oder fest wählen.',
	'settings.language.system': 'System',

	'settings.navigation': 'Navigation',
	'settings.navigation.description':
		'Was die Seitenleiste anbietet. Eine Plattform auszublenden meldet dich nicht ab.',
	'settings.showX': 'X anzeigen',
	'settings.showX.description': 'Beiträge, Antworten, Reposts, Likes, Gefolgt.',
	'settings.showYouTube': 'YouTube anzeigen',
	'settings.showYouTube.description': 'Kommentare und gelikte Videos.',
	'settings.showIntro': 'Einführung anzeigen',
	'settings.showIntro.description':
		'Die Karte auf der Übersicht, die erklärt, wie die App arbeitet.',
	'settings.showLog': 'Protokoll anzeigen',
	'settings.showLog.description': 'Ein Live-Protokoll jeder Aktion als eigene Seite.',

	'settings.safety': 'Sicherheit',
	'settings.safety.description':
		'Löschungen lassen sich nicht rückgängig machen. Das hier bestimmt, wie deutlich gefragt wird.',
	'settings.confirm': 'Vor dem Löschen nachfragen',
	'settings.confirm.description': 'Einmal pro Durchlauf.',

	'settings.timing': 'Zeiten',
	'settings.timing.description':
		'Diese Werte zu erhöhen ist immer sicher. Sie zu senken macht das Löschen schneller, aber auffälliger.',
	'settings.timing.afterLoad': 'Nach dem Laden einer Seite',
	'settings.timing.afterLoad.description':
		'Wie lange die Seite sich setzen darf, bevor zum ersten Mal gelöscht wird.',
	'settings.timing.betweenDeletes': 'Zwischen Löschungen',
	'settings.timing.betweenDeletes.description':
		'Pause nach jedem entfernten Eintrag. Die wichtigste Bremse gegen Automatisierungserkennung.',
	'settings.timing.betweenRetries': 'Zwischen Wiederholungen',
	'settings.timing.betweenRetries.description':
		'Pause, bevor ein Eintrag erneut versucht wird, der nicht verschwunden ist.',

	'settings.about': 'Über',
	'settings.about.description':
		'Nicht verbunden mit, unterstützt von oder gesponsert durch X Corp. oder Google LLC. X und YouTube sind Marken ihrer jeweiligen Inhaber.',
	'settings.version': 'Version {version}',
	'settings.versionLoading': 'Version wird geladen…',
	'settings.checkUpdates': 'Nach Updates suchen',
	'settings.noUpdates': 'Keine Updates verfügbar.',
	'settings.github': 'Projekt auf GitHub',
	'settings.reportBug': 'Fehler melden',
	'settings.licenses': 'Lizenzen Dritter'
};
