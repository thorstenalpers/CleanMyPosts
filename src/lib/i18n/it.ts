import type { MessageKey } from './en';

/** Typed against `MessageKey`, so a key added in English fails to compile until it lands here. */
export const it: Record<MessageKey, string> = {
	'app.tagline': 'Elimina post, like e commenti',

	'nav.overview': 'Panoramica',
	'nav.log': 'Registro',
	'nav.assistant': 'Assistente',
	'nav.settings': 'Impostazioni',
	'nav.info': 'Info',
	'nav.collapse': 'Comprimi il menu',
	'nav.expand': 'Espandi il menu',

	'header.toDark': 'Passa alla modalità scura',
	'header.toLight': 'Passa alla modalità chiara',
	'header.language': 'Lingua',

	'site.signedIn': 'Accesso effettuato',
	'site.signedOut': 'Nessun accesso',
	'site.signInHint':
		'Accedi a {platform} nel browser accanto a questo pannello per poter fare pulizia.',

	'action.show': 'Mostra {label}',
	'action.delete': 'Elimina tutto: {label}',
	'action.deleteAll': 'Elimina tutto',
	'confirm.all.title': 'Eliminare tutto su {platform}?',
	'confirm.all.description':
		'Svuotati uno dopo l’altro, su {platform}: {lists}. L’operazione è irreversibile.',
	'run.allDone': '{count} elementi eliminati in totale.',
	'run.allPartly': '{count} elementi eliminati, {failed} elenchi non riusciti.',
	'action.close': 'Chiudi le azioni di {platform}',
	'action.open': 'Apri le azioni di {platform}',

	'assistant.plan.count': 'Controlla prima',
	'assistant.plan.run': 'Esegui una volta',
	'assistant.plan.matches': '{count} corrispondenze in questa pagina',
	'assistant.plan.removed': '{count} rimossi',
	'assistant.plan.rejected': 'Non è un piano — {reason}',
	'assistant.plan.noPlatform': 'Accedi a una piattaforma per provarlo qui',
	'assistant.plan.label': 'Piano dell’assistente',

	'group.posts': 'Post',
	'group.replies': 'Risposte',
	'group.reposts': 'Repost',
	'group.likes': 'Mi piace',
	'group.following': 'Seguiti',
	'group.comments': 'Commenti',
	'plural.posts': 'post',
	'plural.replies': 'risposte',
	'plural.reposts': 'repost',
	'plural.likes': 'mi piace',
	'plural.following': 'account seguiti',
	'plural.comments': 'commenti',
	'plural.likedVideos': 'video con mi piace',

	'confirm.title': 'Eliminare tutti i {plural}?',
	'confirm.description':
		'Questo rimuove ogni singolo dei tuoi {plural} su {platform}. Non è reversibile.',
	'confirm.confirm': 'Elimina',
	'confirm.cancel': 'Annulla',

	'run.deleting': 'Eliminazione di {label}',
	'run.removedSoFar': '{count} rimossi finora',
	'run.stop': 'Ferma',
	'run.none': 'Nessun {plural} rimosso: non c’era niente da eliminare.',
	'run.done': '{count} {plural} ripuliti.',
	'run.failed': 'Eliminazione non riuscita.',

	'overview.title': 'Panoramica',
	'overview.subtitle': 'Cosa è collegato, cosa si può ripulire e cosa è in corso.',
	'overview.how.title': 'Come funziona',
	'overview.how.lead':
		'CleanMyPosts elimina i tuoi post, mi piace e commenti guidando una vera sessione del browser: gli stessi clic che faresti tu, solo senza fermarsi.',
	'overview.how.automation.title': 'Automazione del browser, non una API.',
	'overview.how.automation.body':
		'La pagina della piattaforma viene aperta in una finestra del browser dentro questa app e cliccata al posto tuo. Nessun account sviluppatore, nessun OAuth, nessuna chiave API: niente che una piattaforma possa revocare o limitare in modo diverso da come fa con una persona.',
	'overview.how.free.title': 'Gratis, e resta così.',
	'overview.how.free.body':
		'Non c’è account, né abbonamento, né versione a pagamento. Niente viene addebitato per eliminazione perché non viene addebitato nulla.',
	'overview.how.private.title': 'Niente lascia il tuo computer.',
	'overview.how.private.body':
		'Il tuo accesso resta nel profilo del browser che Windows tiene già per questa app, esattamente come in un browser. I tuoi post non vengono mai caricati, copiati o conservati: l’unico file scritto sono le impostazioni di questa app. L’eliminazione è lenta di proposito, con pause che decidi tu, perché è questo che le impedisce di sembrare un bot.',
	'overview.how.dismiss': 'Capito — non mostrare più',
	'overview.kinds': 'Si possono rimuovere {count} tipi di contenuto.',
	'overview.open': 'Apri {platform}',
	'overview.now.title': 'In questo momento',
	'overview.now.running': 'Eliminazione di {label} — {count} rimossi finora.',
	'overview.now.idle': 'Non è in corso nulla.',
	'overview.now.confirmOn': 'La conferma prima di eliminare è attiva.',
	'overview.now.confirmOff': 'La conferma prima di eliminare è disattivata.',
	'overview.now.pause': 'Pausa tra le eliminazioni: {count} ms.',

	'log.title': 'Registro',
	'log.errors': '{count} errori',
	'log.warnings': '{count} avvisi',
	'log.filter': 'Filtra…',
	'log.filterLabel': 'Filtra i messaggi del registro',
	'log.levelLabel': 'Filtra per livello',
	'log.level.all': 'Tutti',
	'log.level.debug': 'Debug',
	'log.level.info': 'Info',
	'log.level.warning': 'Avviso',
	'log.level.error': 'Errore',
	'log.clear': 'Svuota',
	'log.empty': 'Ancora nessuna voce.',
	'log.noMatch': 'Nessuna voce corrisponde al filtro.',
	'log.jump': 'Vai alla più recente',

	'settings.title': 'Impostazioni',
	'settings.subtitle': 'Le modifiche vengono salvate mentre le fai.',
	'settings.invalid': 'Valore non valido.',

	'settings.appearance': 'Aspetto',
	'settings.appearance.description': 'Come appare l’app su questo computer.',
	'settings.mode': 'Modalità',
	'settings.mode.description': 'Segui Windows o scegline una fissa.',
	'settings.mode.light': 'Chiara',
	'settings.mode.dark': 'Scura',
	'settings.mode.system': 'Sistema',
	'settings.colour': 'Colore',
	'settings.colour.description':
		'Cambia solo l’accento. Il rosso resta riservato all’eliminazione.',
	'settings.language': 'Lingua',
	'settings.language.description': 'Segui Windows o scegline una fissa.',
	'settings.language.system': 'Sistema',

	'settings.navigation': 'Navigazione',
	'settings.navigation.description':
		'Cosa offre la barra laterale. Nascondere una piattaforma non ti disconnette.',
	'settings.showX': 'Mostra X',
	'settings.showX.description': 'Post, risposte, repost, mi piace, seguiti.',
	'settings.showYouTube': 'Mostra YouTube',
	'settings.showYouTube.description': 'Commenti e video con mi piace.',
	'settings.showIntro': 'Mostra le info',
	'settings.showIntro.description': 'Il riquadro nella panoramica che spiega come lavora l’app.',
	'settings.showLog': 'Mostra il registro',
	'settings.showLog.description': 'Un registro dal vivo di ogni azione, come pagina a sé.',
	'settings.showAssistant': 'Mostra l’assistente',
	'settings.showAssistant.description':
		'Una pagina che risponde a domande sull’app e sul registro.',

	'settings.safety': 'Sicurezza',
	'settings.safety.description':
		'Le eliminazioni non si possono annullare. Qui si decide quanto insistentemente ti viene chiesto.',
	'settings.confirm': 'Chiedi conferma prima di eliminare',
	'settings.confirm.description': 'Una volta per esecuzione.',

	'settings.timing': 'Tempi',
	'settings.timing.description':
		'Alzare questi valori è sempre sicuro. Abbassarli rende l’eliminazione più veloce, ma più facile da riconoscere come automazione.',
	'settings.timing.afterLoad': 'Dopo il caricamento di una pagina',
	'settings.timing.afterLoad.description':
		'Quanto lasciare assestare la pagina prima della prima eliminazione.',
	'settings.timing.betweenDeletes': 'Tra le eliminazioni',
	'settings.timing.betweenDeletes.description':
		'Pausa dopo ogni elemento rimosso. Il freno principale contro il rilevamento dell’automazione.',
	'settings.timing.betweenRetries': 'Tra i tentativi',
	'settings.timing.betweenRetries.description':
		'Pausa prima di riprovare con un elemento che non è sparito.',

	'settings.assistant': 'Assistente',
	'settings.assistant.description':
		'Da dove arrivano le risposte. Il binario locale non manda nulla da questa app; un provider ospitato è l’unica cosa qui che mette dati in rete.',
	'settings.assistant.source': 'Origine',
	'settings.assistant.off': 'Disattivato',
	'settings.assistant.off.description':
		"L'assistente è disattivato e non compare nella barra laterale.",
	'settings.assistant.local': 'Claude Code su questo computer',
	'settings.assistant.hosted': 'Un provider ospitato',
	'settings.assistant.cliPath': 'Percorso del binario',
	'settings.assistant.cliPath.description':
		'Lascia vuoto per cercare dove Claude Code si installa.',
	'settings.assistant.cliPath.placeholder': 'claude.exe',
	'settings.assistant.cliFound': 'Trovato: {version}',
	'settings.assistant.cliMissing': 'Non trovato su questo computer.',
	'settings.assistant.provider': 'Provider',
	'settings.assistant.provider.description':
		'Quale modello ospitato risponde, e la sua chiave API.',
	'settings.assistant.keys': 'Chiavi API',
	'settings.assistant.keys.title': 'Chiavi API',
	'settings.assistant.keys.description':
		'Le chiavi finiscono in Gestione credenziali di Windows, mai in un file di questa app. Una chiave non si può rileggere: solo sostituire o dimenticare.',
	'settings.assistant.keys.placeholder': 'Incolla una chiave per salvarla',
	'settings.assistant.keys.stored': 'Salvata',
	'settings.assistant.keys.saved': 'Applicata',
	'settings.assistant.keys.none': 'Nessuna chiave',
	'settings.assistant.keys.free': 'Ottieni una chiave gratuita',
	'settings.assistant.keys.forget': 'Dimentica',
	'settings.assistant.keys.close': 'Fatto',

	'assistant.title': 'Assistente',
	'assistant.subtitle': 'Domande su cosa fa questa app e su cosa dice il registro.',
	'assistant.placeholder.patch': 'Da me la voce di menu dice «Rimuovi dai video che ti piacciono»',
	'assistant.placeholder.report':
		'L’eliminazione dei like si è fermata dopo tre video e il menu si è chiuso da solo',
	'assistant.placeholder': 'Perché 12 post non sono stati eliminati?',
	'assistant.ask': 'Chiedi',
	'assistant.asking': 'Sto chiedendo…',
	'assistant.noSource':
		'Non è ancora configurata nessuna origine. Scegline una nelle impostazioni: Claude Code su questo computer, oppure la chiave di un provider.',
	'assistant.openSettings': 'Apri le impostazioni',
	'assistant.sendsLog':
		'La domanda viene inviata insieme al registro e a una descrizione dell’app. Il registro non contiene mai il contenuto dei post, i nomi utente o i cookie.',
	'assistant.clear': 'Svuota',
	'assistant.troubleshooting': 'Risoluzione dei problemi',
	'assistant.troubleshooting.hint':
		'Quasi tutti i fallimenti hanno una causa nota e una soluzione nota. La guida li elenca — e a questo assistente viene passato lo stesso elenco insieme al tuo registro.',
	'assistant.preview.show': 'Mostra cosa viene inviato',
	'assistant.preview.hide': 'Nascondi cosa viene inviato',
	'assistant.preview.description':
		'La richiesta, esattamente come lascerebbe questo computer. Non viene aggiunto altro.',
	'assistant.preview.role': 'Istruzioni',
	'assistant.preview.app': 'Sull’app',
	'assistant.preview.fixes': 'Errori noti e soluzioni',
	'assistant.preview.log': 'Il registro',
	'assistant.preview.question': 'La tua domanda',
	'assistant.preview.noQuestion': 'Scrivi una domanda sopra per vederla qui.',

	'settings.about': 'Informazioni',
	'settings.about.description':
		'Non affiliata, approvata o sponsorizzata da X Corp. o Google LLC. X e YouTube sono marchi dei rispettivi proprietari.',
	'settings.versionBuilt': 'Versione {version}, compilata il {date}',
	'settings.versionLoading': 'Caricamento della versione…',
	'settings.checkUpdates': 'Controlla gli aggiornamenti',
	'settings.noUpdates': 'Nessun aggiornamento disponibile.',
	'update.checking': 'Ricerca in corso…',
	'update.available.title': 'Aggiornamento disponibile',
	'update.available.body':
		'La versione {version} è pronta per essere installata. Al termine CleanMyPosts si chiude e si riapre da solo; le operazioni in corso vengono interrotte.',
	'update.install': 'Installa e riavvia',
	'update.later': 'Non ora',
	'update.downloading': 'Download dell’aggiornamento {version}',
	'update.downloadingPercent': 'Download dell’aggiornamento {version} — {percent} %',
	'update.failed': 'Non è stato possibile installare l’aggiornamento: {message}',
	'update.checkFailed': 'Non è stato possibile cercare aggiornamenti: {message}',
	'settings.github': 'Progetto su GitHub',
	'settings.reportBug': 'Segnala un problema',
	'settings.licenses': 'Licenze di terze parti',

	'info.title': 'Info',
	'info.subtitle': 'Cos’è questa app, da dove viene e su cosa è costruita.',
	'info.app.title': 'CleanMyPosts',
	'info.app.body':
		'Un’app per Windows che svuota quello che hai pubblicato, apprezzato e seguito, una piattaforma alla volta. Lavora come faresti tu: apre la pagina in una finestra del browser e ci clicca dentro finché non resta nulla da rimuovere.',
	'info.developer': 'Sviluppatore',
	'info.version.title': 'Questa installazione',
	'info.version.description': 'Gli aggiornamenti li scarica e li installa l’app stessa.',
	'info.links.title': 'Link',
	'info.links.description': 'È tutto aperto: il codice, i problemi e le sue fondamenta.',
	'info.github.description': 'Il sorgente, le release e la storia che c’è dietro.',
	'info.reportBug.description': 'Qualcosa non è stato eliminato, o lo è stato due volte? Va qui.',
	'info.licenses.description': 'Le librerie open source incluse in questa app, con i loro termini.',
	'info.legal.title': 'Note legali',
	'info.troubleshooting.description':
		'Gli errori che tornano di continuo, e cosa fare per ciascuno.',

	'settings.general': 'Generale',
	'settings.general.description':
		'Quali pagine offre l’app. Nascondere una piattaforma non ti disconnette.',
	'settings.notifications': 'Notifiche',
	'settings.notifications.description':
		'Un breve messaggio quando un’esecuzione finisce. Sparisce da solo dopo un secondo.',
	'settings.autoConsent': 'Chiudi i banner dei cookie',
	'settings.autoConsent.description':
		'Chiude da sé i banner di consenso, usando il pulsante che rifiuta dove il banner ne offre uno.',
	'settings.reset.title': 'Ripristina',
	'settings.reset.description':
		'Riporta tutte le impostazioni allo stato di una nuova installazione.',
	'settings.reset.action': 'Ripristina i valori predefiniti',
	'settings.reset.confirmBody':
		'Tutte le impostazioni tornano al valore predefinito, tema, lingua e assistente compresi. Le sessioni attive e il registro non vengono toccati.',
	'settings.reset.done': 'Impostazioni ripristinate',
	'settings.debugLogging': 'Registro dettagliato',
	'settings.debugLogging.description':
		"Annota cosa offriva davvero la pagina della piattaforma quando un'eliminazione non è riuscita. Utile per una segnalazione, rumoroso altrimenti.",
	'settings.persistSession': 'Resta connesso',
	'settings.persistSession.description':
		'Conserva la cache e i cookie di WebView2 tra un avvio e l’altro. Disattivato li cancella a ogni avvio, così X e YouTube si aprono disconnessi.',
	'settings.checkUpdatesOnStart': 'Cerca aggiornamenti all’avvio',
	'settings.checkUpdatesOnStart.description':
		'A ogni avvio chiede alla pagina dei rilasci se esiste una versione più recente e lo segnala nella panoramica. Disattivato, gli aggiornamenti si trovano solo premendo il pulsante nella pagina Info.',
	'settings.automation': 'Automazione',
	'settings.automation.description': 'Come si comporta un’esecuzione e su cosa clicca.',
	'settings.engine': 'Motore di eliminazione',
	'settings.engine.none': 'Comportamento integrato',
	'settings.engine.active': 'Il tuo script, {count} righe',
	'settings.engine.edit': 'Modifica',
	'settings.engine.reset': 'Ripristina',
	'settings.engine.save': 'Salva',
	'settings.engine.hint':
		'Gira nella pagina della piattaforma prima di ogni azione. In `window.__cmp.config` ci sono tutti i selettori e tutte le parole che il motore cerca: cambia ciò che la tua lingua o la tua regione richiede. Uno script rotto non costa nulla: viene intercettato, registrato, e il comportamento integrato prosegue.',
	'settings.engine.placeholder': "window.__cmp.config.youtube.removeFromLikedText.push('…');",

	'assistant.report': 'Segnalare un problema',
	'assistant.report.hint':
		"L'assistente trasforma il registro in una segnalazione di bug. La leggi, poi GitHub si apre con il modulo compilato: inviarla resta un tuo clic, perché una issue è pubblica.",
	'assistant.report.open': 'Segnala su GitHub',
	'assistant.preview.report': 'Segnalazione di bug',
	'assistant.mode': 'Di cosa tratta questa richiesta',
	'assistant.mode.question': 'Domanda',
	'assistant.patch': 'AI Repair (sperimentale)',
	'assistant.patch.hint':
		"Quando un'esecuzione non elimina nulla, la pagina di solito usa parole diverse da quelle attese dall'app. Descrivi ciò che vedi - la voce di menu, il pulsante - e l'assistente scrive un piccolo script. Una volta salvato viene eseguito nella pagina della piattaforma prima di ogni eliminazione, quindi leggilo prima.",
	'assistant.patch.apply': 'Salva la correzione',
	'assistant.patch.applied': 'Salvato. La prossima esecuzione lo usa.',
	'assistant.openInCli': 'Continua in Claude Code',
	'assistant.dismiss': 'Nascondi',

	'header.url': 'Sei qui',

	'log.column.time': 'Ora',
	'log.column.level': 'Livello',
	'log.column.message': 'Messaggio',
	'log.sortBy': 'Ordina per {column}',

	'assistant.preview.source': 'Dov’è il codice',
	'assistant.preview.patch': 'Il compito della patch'
};
