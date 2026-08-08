import type { MessageKey } from './en';

/** Typed against `MessageKey`, so a key added in English fails to compile until it lands here. */
export const de: Record<MessageKey, string> = {
	'app.tagline': 'Löscht Posts, Likes und Kommentare',

	'nav.overview': 'Übersicht',
	'nav.log': 'Protokoll',
	'nav.assistant': 'Assistent',
	'nav.settings': 'Einstellungen',
	'nav.info': 'Info',
	'nav.collapse': 'Menü einklappen',
	'nav.expand': 'Menü ausklappen',

	'header.toDark': 'Zu dunklem Modus wechseln',
	'header.toLight': 'Zu hellem Modus wechseln',
	'header.language': 'Sprache',

	'site.signedIn': 'Angemeldet',
	'site.signedOut': 'Nicht angemeldet',
	'site.signInHint':
		'Melde dich im Browser neben dieser Leiste bei {platform} an, um aufräumen zu können.',

	'action.show': '{label} anzeigen',
	'action.delete': 'Alle {label} löschen',
	'action.deleteAll': 'Alles löschen',
	'confirm.all.title': 'Alles auf {platform} löschen?',
	'confirm.all.description':
		'Nacheinander geleert, auf {platform}: {lists}. Das lässt sich nicht rückgängig machen.',
	'run.allDone': 'Insgesamt {count} Einträge gelöscht.',
	'run.allPartly': '{count} Einträge gelöscht, {failed} Listen fehlgeschlagen.',
	'action.close': 'Aktionen für {platform} schließen',
	'action.open': 'Aktionen für {platform} öffnen',

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
	'log.level.debug': 'Debug',
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
	'settings.showIntro': 'Info anzeigen',
	'settings.showIntro.description':
		'Die Karte auf der Übersicht, die erklärt, wie die App arbeitet.',
	'settings.showLog': 'Protokoll anzeigen',
	'settings.showLog.description': 'Ein Live-Protokoll jeder Aktion als eigene Seite.',
	'settings.showAssistant': 'Assistent anzeigen',
	'settings.showAssistant.description':
		'Eine Seite, die Fragen zur App und zum Protokoll beantwortet.',

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

	'settings.assistant': 'Assistent',
	'settings.assistant.description':
		'Woher Antworten kommen. Das lokale Programm sendet nichts aus dieser App; ein gehosteter Anbieter ist das Einzige hier, das Daten ins Netz gibt.',
	'settings.assistant.source': 'Quelle',
	'settings.assistant.off': 'Aus',
	'settings.assistant.off.description':
		'Der Assistent ist ausgeschaltet und erscheint nicht in der Seitenleiste.',
	'settings.assistant.local': 'Claude Code auf diesem Rechner',
	'settings.assistant.hosted': 'Ein gehosteter Anbieter',
	'settings.assistant.cliPath': 'Pfad zum Programm',
	'settings.assistant.cliPath.description':
		'Leer lassen, um dort zu suchen, wo Claude Code sich installiert.',
	'settings.assistant.cliPath.placeholder': 'claude.exe',
	'settings.assistant.cliFound': 'Gefunden: {version}',
	'settings.assistant.cliMissing': 'Auf diesem Rechner nicht gefunden.',
	'settings.assistant.provider': 'Anbieter',
	'settings.assistant.provider.description':
		'Welches gehostete Modell antwortet, und sein Schlüssel.',
	'settings.assistant.keys': 'API-Schlüssel',
	'settings.assistant.keys.title': 'API-Schlüssel',
	'settings.assistant.keys.description':
		'Schlüssel liegen in der Windows-Anmeldeinformationsverwaltung, nie in einer Datei dieser App. Ein Schlüssel lässt sich nicht zurücklesen — nur ersetzen oder vergessen.',
	'settings.assistant.keys.placeholder': 'Schlüssel einfügen, um ihn zu speichern',
	'settings.assistant.keys.stored': 'Gespeichert',
	'settings.assistant.keys.saved': 'Übernommen',
	'settings.assistant.keys.none': 'Kein Schlüssel',
	'settings.assistant.keys.free': 'Kostenlosen Schlüssel holen',
	'settings.assistant.keys.forget': 'Vergessen',
	'settings.assistant.keys.close': 'Fertig',

	'assistant.title': 'Assistent',
	'assistant.subtitle': 'Fragen dazu, was diese App tut, und dazu, was im Protokoll steht.',
	'assistant.placeholder.patch':
		'Bei mir heißt der Menüeintrag „Aus „Videos, die ich mag“ entfernen“',
	'assistant.placeholder.report':
		'Das Löschen der Likes stoppte nach drei Videos und das Menü schloss sich von selbst',
	'assistant.placeholder': 'Warum wurden 12 Beiträge nicht gelöscht?',
	'assistant.ask': 'Fragen',
	'assistant.asking': 'Wird gefragt…',
	'assistant.noSource':
		'Es ist noch keine Quelle eingerichtet. Wähle eine in den Einstellungen — Claude Code auf diesem Rechner oder einen Anbieterschlüssel.',
	'assistant.openSettings': 'Einstellungen öffnen',
	'assistant.sendsLog':
		'Die Frage geht zusammen mit dem Protokoll und einer Beschreibung der App raus. Das Protokoll enthält nie Beitragsinhalte, Kontonamen oder Cookies.',
	'assistant.clear': 'Leeren',
	'assistant.troubleshooting': 'Fehlerbehebung',
	'assistant.troubleshooting.hint':
		'Die meisten Fehlschläge haben eine bekannte Ursache und eine bekannte Lösung. Die Anleitung zählt sie auf — und dieser Assistent bekommt dieselbe Liste zusammen mit deinem Protokoll.',
	'assistant.preview.show': 'Anzeigen, was gesendet wird',
	'assistant.preview.hide': 'Ausblenden, was gesendet wird',
	'assistant.preview.description':
		'Die Anfrage, genau so, wie sie diesen Rechner verlassen würde. Mehr wird nicht angehängt.',
	'assistant.preview.role': 'Anweisungen',
	'assistant.preview.app': 'Über die App',
	'assistant.preview.fixes': 'Bekannte Fehler und Lösungen',
	'assistant.preview.log': 'Das Protokoll',
	'assistant.preview.question': 'Deine Frage',
	'assistant.preview.noQuestion': 'Tippe oben eine Frage, um sie hier zu sehen.',

	'settings.about': 'Über',
	'settings.about.description':
		'Nicht verbunden mit, unterstützt von oder gesponsert durch X Corp. oder Google LLC. X und YouTube sind Marken ihrer jeweiligen Inhaber.',
	'settings.versionBuilt': 'Version {version}, erstellt am {date}',
	'settings.versionLoading': 'Version wird geladen…',
	'settings.checkUpdates': 'Nach Updates suchen',
	'settings.noUpdates': 'Keine Updates verfügbar.',
	'update.checking': 'Suche läuft…',
	'update.available.title': 'Update verfügbar',
	'update.available.body':
		'Version {version} kann installiert werden. CleanMyPosts schließt und öffnet sich danach selbst; laufende Vorgänge werden abgebrochen.',
	'update.install': 'Installieren und neu starten',
	'update.later': 'Jetzt nicht',
	'update.downloading': 'Update {version} wird geladen',
	'update.downloadingPercent': 'Update {version} wird geladen — {percent} %',
	'update.failed': 'Das Update konnte nicht installiert werden: {message}',
	'update.checkFailed': 'Es konnte nicht nach Updates gesucht werden: {message}',
	'settings.github': 'Projekt auf GitHub',
	'settings.reportBug': 'Fehler melden',
	'settings.licenses': 'Lizenzen Dritter',

	'info.title': 'Info',
	'info.subtitle': 'Was diese App ist, woher sie kommt und worauf sie aufbaut.',
	'info.app.title': 'CleanMyPosts',
	'info.app.body':
		'Eine Windows-App, die aufräumt, was du gepostet, geliked und abonniert hast — eine Plattform nach der anderen. Sie geht dabei vor wie du selbst: Sie öffnet die Seite in einem Browserfenster und klickt sich durch, bis nichts mehr zu entfernen ist.',
	'info.developer': 'Entwickler',
	'info.version.title': 'Diese Installation',
	'info.version.description': 'Updates lädt und installiert die App selbst.',
	'info.links.title': 'Links',
	'info.links.description': 'Alles liegt offen: der Code, die Fehler und das, worauf sie aufbaut.',
	'info.github.description': 'Der Quelltext, die Releases und die Geschichte dahinter.',
	'info.reportBug.description':
		'Etwas wurde nicht gelöscht — oder gleich zweimal? Hier gehört es hin.',
	'info.licenses.description': 'Die Open-Source-Bibliotheken in dieser App und ihre Bedingungen.',
	'info.legal.title': 'Rechtliches',
	'info.troubleshooting.description':
		'Die Fehler, die immer wieder auftauchen, und was jeweils dagegen hilft.',

	'settings.general': 'Allgemein',
	'settings.general.description':
		'Welche Seiten die App anbietet. Eine Plattform auszublenden meldet dich nicht ab.',
	'settings.notifications': 'Benachrichtigungen',
	'settings.notifications.description':
		'Eine kurze Meldung, wenn ein Durchlauf endet. Sie verschwindet nach einer Sekunde von selbst.',
	'settings.autoConsent': 'Cookie-Banner wegklicken',
	'settings.autoConsent.description':
		'Zustimmungsbanner automatisch schließen, und zwar über den ablehnenden Knopf, wo das Banner einen anbietet.',
	'settings.reset.title': 'Zurücksetzen',
	'settings.reset.description':
		'Setzt alle Einstellungen auf den Stand einer Neuinstallation zurück.',
	'settings.reset.action': 'Auf Standard zurücksetzen',
	'settings.reset.confirmBody':
		'Alle Einstellungen gehen auf ihren Standardwert zurück, auch Design, Sprache und Assistent. Angemeldete Sitzungen und das Protokoll bleiben unberührt.',
	'settings.reset.done': 'Einstellungen zurückgesetzt',
	'settings.debugLogging': 'Ausführliches Protokoll',
	'settings.debugLogging.description':
		'Hält fest, was eine Plattform-Seite tatsächlich angeboten hat, wenn ein Löschvorgang nicht weiterkam. Nützlich für einen Fehlerbericht, sonst nur Lärm.',
	'settings.persistSession': 'Angemeldet bleiben',
	'settings.persistSession.description':
		'Cache und Cookies von WebView2 über Neustarts hinweg behalten. Aus verwirft sie bei jedem Start — X und YouTube öffnen dann abgemeldet.',
	'settings.checkUpdatesOnStart': 'Beim Start nach Updates suchen',
	'settings.checkUpdatesOnStart.description':
		'Bei jedem Start die Release-Seite nach einer neueren Version fragen und in der Übersicht Bescheid geben, wenn es eine gibt. Aus heißt: Updates werden nur gefunden, wenn du auf der Info-Seite den Knopf drückst.',
	'settings.automation': 'Automatisierung',
	'settings.automation.description': 'Wie ein Durchlauf sich verhält und worauf er klickt.',
	'settings.engine': 'Lösch-Engine',
	'settings.engine.none': 'Eingebautes Verhalten',
	'settings.engine.active': 'Dein eigenes Skript, {count} Zeilen',
	'settings.engine.edit': 'Bearbeiten',
	'settings.engine.reset': 'Zurücksetzen',
	'settings.engine.save': 'Speichern',
	'settings.engine.hint':
		'Läuft in der Plattformseite vor jeder Aktion. In `window.__cmp.config` stehen alle Selektoren und alle Wörter, nach denen die Engine sucht — ändere, was deine Sprache oder Region braucht. Ein kaputtes Skript kostet den Durchlauf nichts: Es wird abgefangen, protokolliert, und das eingebaute Verhalten läuft weiter.',
	'settings.engine.placeholder': "window.__cmp.config.youtube.removeFromLikedText.push('…');",

	'assistant.report': 'Fehler melden',
	'assistant.report.hint':
		'Der Assistent macht aus dem Protokoll einen Fehlerbericht. Du liest ihn, dann öffnet sich GitHub mit ausgefülltem Formular — abschicken bleibt dein Klick, denn ein Issue ist öffentlich.',
	'assistant.report.open': 'Auf GitHub melden',
	'assistant.preview.report': 'Fehlerbericht',
	'assistant.mode': 'Worum es bei dieser Anfrage geht',
	'assistant.mode.question': 'Frage',
	'assistant.patch': 'AI Repair (experimentell)',
	'assistant.patch.hint':
		'Wenn ein Durchlauf nichts löscht, steht auf der Seite meist etwas anderes, als die App erwartet. Beschreibe, was du siehst - den Menüeintrag, den Knopf - und der Assistent schreibt ein kleines Skript. Gespeichert läuft es vor jedem Löschvorgang in der Plattform-Seite, lies es also vorher.',
	'assistant.patch.apply': 'Anpassung speichern',
	'assistant.patch.applied': 'Gespeichert. Der nächste Durchlauf nutzt es.',
	'assistant.openInCli': 'In Claude Code weitermachen',
	'assistant.dismiss': 'Ausblenden',

	'header.url': 'Du bist hier',

	'log.column.time': 'Zeit',
	'log.column.level': 'Stufe',
	'log.column.message': 'Meldung',
	'log.sortBy': 'Nach {column} sortieren',

	'assistant.preview.source': 'Wo der Code liegt',
	'assistant.preview.patch': 'Der Auftrag für das Skript'
};
