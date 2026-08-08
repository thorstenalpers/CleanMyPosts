import type { MessageKey } from './en';

/** Typed against `MessageKey`, so a key added in English fails to compile until it lands here. */
export const fr: Record<MessageKey, string> = {
	'app.tagline': 'Supprime posts, likes et commentaires',

	'nav.overview': 'Vue d’ensemble',
	'nav.log': 'Journal',
	'nav.assistant': 'Assistant',
	'nav.settings': 'Paramètres',
	'nav.info': 'Infos',
	'nav.collapse': 'Réduire le menu',
	'nav.expand': 'Déployer le menu',

	'header.toDark': 'Passer en mode sombre',
	'header.toLight': 'Passer en mode clair',
	'header.language': 'Langue',

	'site.signedIn': 'Connecté',
	'site.signedOut': 'Non connecté',
	'site.signInHint':
		'Connecte-toi à {platform} dans le navigateur à côté de ce panneau pour pouvoir nettoyer.',

	'action.show': 'Afficher {label}',
	'action.delete': 'Supprimer tout : {label}',
	'action.deleteAll': 'Tout supprimer',
	'confirm.all.title': 'Tout supprimer sur {platform} ?',
	'confirm.all.description':
		'Vidés l’un après l’autre, sur {platform} : {lists}. Cette action est irréversible.',
	'run.allDone': '{count} éléments supprimés au total.',
	'run.allPartly': '{count} éléments supprimés, {failed} listes en échec.',
	'action.close': 'Fermer les actions {platform}',
	'action.open': 'Ouvrir les actions {platform}',

	'assistant.controls': 'Réglages de l’assistant',
	'assistant.close': 'Fermer l’assistant',
	'assistant.effort': 'Effort',
	'assistant.effort.low': 'Bref',
	'assistant.effort.medium': 'Normal',
	'assistant.effort.high': 'Approfondi',
	'assistant.model': 'Modèle',
	'assistant.model.default': 'Valeur par défaut du fournisseur',
	'assistant.panel.empty':
		'Demande un plan pour la page d’à côté : ce qu’il faut retirer, et comment l’un d’eux disparaît.',
	'assistant.noSource.short': 'Aucune source',

	'assistant.plan.save': 'Garder comme action',
	'assistant.plan.name': 'Nom de cette action',
	'assistant.plan.keep': 'Garder',
	'assistant.plan.saved': 'Enregistré — {label} figure maintenant dans les actions',
	'panel.saved': 'Actions enregistrées',
	'confirm.saved.description':
		'Exécute {label}, un plan écrit par l’assistant pour {platform} telle qu’elle était alors. C’est irréversible.',
	'assistant.plan.count': 'Vérifier d’abord',
	'assistant.plan.run': 'Exécuter une fois',
	'assistant.plan.matches': '{count} correspondances sur cette page',
	'assistant.plan.removed': '{count} supprimés',
	'assistant.plan.rejected': 'Pas un plan — {reason}',
	'assistant.plan.noPlatform': 'Connecte-toi à une plateforme pour essayer ici',
	'assistant.plan.label': 'Plan de l’assistant',

	'group.posts': 'Publications',
	'group.replies': 'Réponses',
	'group.reposts': 'Reposts',
	'group.likes': 'J’aime',
	'group.following': 'Abonnements',
	'group.comments': 'Commentaires',
	'plural.posts': 'publications',
	'plural.replies': 'réponses',
	'plural.reposts': 'reposts',
	'plural.likes': 'j’aime',
	'plural.following': 'comptes suivis',
	'plural.comments': 'commentaires',
	'plural.likedVideos': 'vidéos aimées',

	'confirm.title': 'Supprimer toutes les {plural} ?',
	'confirm.description': 'Cela retire chacune de tes {plural} sur {platform}. C’est irréversible.',
	'confirm.confirm': 'Supprimer',
	'confirm.cancel': 'Annuler',

	'run.deleting': 'Suppression : {label}',
	'run.removedSoFar': '{count} supprimées jusqu’ici',
	'run.stop': 'Arrêter',
	'run.none': 'Aucune {plural} supprimée — il n’y avait rien à effacer.',
	'run.done': '{count} {plural} nettoyées.',
	'run.failed': 'La suppression a échoué.',

	'overview.title': 'Vue d’ensemble',
	'overview.subtitle': 'Ce qui est connecté, ce qui peut être nettoyé et ce qui tourne.',
	'overview.how.title': 'Comment ça marche',
	'overview.how.lead':
		'CleanMyPosts supprime tes propres publications, j’aime et commentaires en pilotant une vraie session de navigateur — les mêmes clics que tu ferais toi-même, mais sans jamais t’arrêter.',
	'overview.how.automation.title': 'De l’automatisation de navigateur, pas une API.',
	'overview.how.automation.body':
		'La page de la plateforme s’ouvre dans une fenêtre de navigateur à l’intérieur de cette app, et elle est parcourue à ta place. Pas de compte développeur, pas d’OAuth, pas de clé d’API — rien qu’une plateforme puisse révoquer ou limiter autrement que pour une personne.',
	'overview.how.free.title': 'Gratuit, et ça le reste.',
	'overview.how.free.body':
		'Il n’y a ni compte, ni abonnement, ni offre payante. Rien n’est facturé à la suppression, parce que rien n’est facturé du tout.',
	'overview.how.private.title': 'Rien ne quitte ta machine.',
	'overview.how.private.body':
		'Ta connexion reste dans le profil de navigateur que Windows garde déjà pour cette app, exactement comme dans un navigateur. Tes publications ne sont jamais envoyées, copiées ni stockées — le seul fichier écrit, ce sont les paramètres de cette app. La suppression est volontairement lente, avec des pauses que tu contrôles, car c’est ce qui l’empêche de ressembler à un bot.',
	'overview.how.dismiss': 'Compris — ne plus afficher',
	'overview.kinds': '{count} types de contenu peuvent être retirés.',
	'overview.open': 'Ouvrir {platform}',
	'overview.now.title': 'En ce moment',
	'overview.now.running': 'Suppression : {label} — {count} supprimées jusqu’ici.',
	'overview.now.idle': 'Rien ne tourne.',
	'overview.now.confirmOn': 'La confirmation avant suppression est activée.',
	'overview.now.confirmOff': 'La confirmation avant suppression est désactivée.',
	'overview.now.pause': 'Pause entre les suppressions : {count} ms.',

	'log.title': 'Journal',
	'log.errors': '{count} erreurs',
	'log.warnings': '{count} avertissements',
	'log.filter': 'Filtrer…',
	'log.filterLabel': 'Filtrer les messages du journal',
	'log.levelLabel': 'Filtrer par niveau',
	'log.level.all': 'Tous',
	'log.level.debug': 'Débogage',
	'log.level.info': 'Info',
	'log.level.warning': 'Avertissement',
	'log.level.error': 'Erreur',
	'log.clear': 'Vider',
	'log.empty': 'Rien de consigné pour l’instant.',
	'log.noMatch': 'Aucune entrée ne correspond au filtre.',
	'log.jump': 'Aller au plus récent',

	'settings.title': 'Paramètres',
	'settings.subtitle': 'Les modifications sont enregistrées au fur et à mesure.',
	'settings.invalid': 'Valeur de paramètre non valide.',

	'settings.appearance': 'Apparence',
	'settings.appearance.description': 'L’allure de l’app sur cette machine.',
	'settings.mode': 'Mode',
	'settings.mode.description': 'Suivre Windows ou choisir un mode fixe.',
	'settings.mode.light': 'Clair',
	'settings.mode.dark': 'Sombre',
	'settings.mode.system': 'Système',
	'settings.colour': 'Couleur',
	'settings.colour.description':
		'Seule la couleur d’accent change. Le rouge reste réservé à la suppression.',
	'settings.language': 'Langue',
	'settings.language.description': 'Suivre Windows ou choisir une langue fixe.',
	'settings.language.system': 'Système',

	'settings.navigation': 'Navigation',
	'settings.navigation.description':
		'Ce que propose la barre latérale. Masquer une plateforme ne t’en déconnecte pas.',
	'settings.showX': 'Afficher X',
	'settings.showX.description': 'Publications, réponses, reposts, j’aime, abonnements.',
	'settings.showYouTube': 'Afficher YouTube',
	'settings.showYouTube.description': 'Commentaires et vidéos aimées.',
	'settings.showIntro': 'Afficher les infos',
	'settings.showIntro.description':
		'Le panneau de la vue d’ensemble qui explique le fonctionnement de l’app.',
	'settings.showLog': 'Afficher le journal',
	'settings.showLog.description': 'Un journal en direct de chaque action, sur sa propre page.',
	'settings.showAssistant': 'Afficher l’assistant',
	'settings.showAssistant.description':
		'Une page qui répond aux questions sur l’app et sur le journal.',

	'settings.safety': 'Sécurité',
	'settings.safety.description':
		'Les suppressions sont irréversibles. Ceci décide à quel point on te le demande.',
	'settings.confirm': 'Confirmer avant de supprimer',
	'settings.confirm.description': 'Demander une fois par exécution.',

	'settings.timing': 'Temporisation',
	'settings.timing.description':
		'Augmenter ces valeurs est toujours sans risque. Les baisser rend la suppression plus rapide, mais plus susceptible d’être vue comme de l’automatisation.',
	'settings.timing.afterLoad': 'Après le chargement d’une page',
	'settings.timing.afterLoad.description':
		'Combien de temps laisser la page se stabiliser avant la première suppression.',
	'settings.timing.betweenDeletes': 'Entre les suppressions',
	'settings.timing.betweenDeletes.description':
		'Pause après chaque élément retiré. Le principal frein contre la détection d’automatisation.',
	'settings.timing.betweenRetries': 'Entre les tentatives',
	'settings.timing.betweenRetries.description':
		'Pause avant de réessayer un élément qui n’a pas disparu.',

	'settings.assistant': 'Assistant',
	'settings.assistant.description':
		'D’où viennent les réponses. Le binaire local n’envoie rien depuis cette app ; un fournisseur hébergé est la seule chose ici qui met des données sur le réseau.',
	'settings.assistant.source': 'Source',
	'settings.assistant.off': 'Désactivé',
	'settings.assistant.off.description':
		"L'assistant est désactivé et n'apparaît pas dans la barre latérale.",
	'settings.assistant.local': 'Claude Code sur cette machine',
	'settings.assistant.hosted': 'Un fournisseur hébergé',
	'settings.assistant.cliPath': 'Chemin du binaire',
	'settings.assistant.cliPath.description':
		'Laisse vide pour chercher là où Claude Code s’installe.',
	'settings.assistant.cliPath.placeholder': 'claude.exe',
	'settings.assistant.cliFound': 'Trouvé : {version}',
	'settings.assistant.cliMissing': 'Introuvable sur cette machine.',
	'settings.assistant.provider': 'Fournisseur',
	'settings.assistant.provider.description': 'Quel modèle hébergé répond, et sa clé d’API.',
	'settings.assistant.keys': 'Clés d’API',
	'settings.assistant.keys.title': 'Clés d’API',
	'settings.assistant.keys.description':
		'Les clés vont dans le Gestionnaire d’identification de Windows, jamais dans un fichier de cette app. Une clé ne peut pas être relue — seulement remplacée ou oubliée.',
	'settings.assistant.keys.placeholder': 'Colle une clé pour l’enregistrer',
	'settings.assistant.keys.stored': 'Enregistrée',
	'settings.assistant.keys.saved': 'Prise en compte',
	'settings.assistant.keys.none': 'Aucune clé',
	'settings.assistant.keys.free': 'Obtenir une clé gratuite',
	'settings.assistant.keys.forget': 'Oublier',
	'settings.assistant.keys.close': 'Terminé',

	'assistant.title': 'Assistant',
	'assistant.subtitle': 'Des questions sur ce que fait cette app, et sur ce que dit le journal.',
	'assistant.placeholder.patch':
		'Chez moi l’entrée de menu s’appelle « Retirer des vidéos que j’aime »',
	'assistant.placeholder.report':
		'La suppression des likes s’est arrêtée après trois vidéos et le menu s’est refermé',
	'assistant.placeholder': 'Pourquoi 12 publications n’ont-elles pas été supprimées ?',
	'assistant.ask': 'Demander',
	'assistant.asking': 'Question en cours…',
	'assistant.noSource':
		'Aucune source n’est encore configurée. Choisis-en une dans les paramètres — Claude Code sur cette machine, ou la clé d’un fournisseur.',
	'assistant.openSettings': 'Ouvrir les paramètres',
	'assistant.sendsLog':
		'La question part avec le journal et une description de l’app. Le journal ne contient jamais le contenu des publications, les identifiants ni les cookies.',
	'assistant.clear': 'Vider',
	'assistant.troubleshooting': 'Dépannage',
	'assistant.troubleshooting.hint':
		'La plupart des échecs ont une cause connue et une solution connue. Le guide les recense — et cet assistant reçoit cette même liste avec ton journal.',
	'assistant.preview.show': 'Voir ce qui est envoyé',
	'assistant.preview.hide': 'Masquer ce qui est envoyé',
	'assistant.preview.description':
		'La requête, exactement telle qu’elle quitterait cette machine. Rien d’autre n’est ajouté.',
	'assistant.preview.role': 'Consignes',
	'assistant.preview.app': 'À propos de l’app',
	'assistant.preview.fixes': 'Échecs connus et solutions',
	'assistant.preview.log': 'Le journal',
	'assistant.preview.question': 'Ta question',
	'assistant.preview.noQuestion': 'Tape une question ci-dessus pour la voir ici.',

	'settings.about': 'À propos',
	'settings.about.description':
		'Sans affiliation, approbation ni parrainage de X Corp. ou de Google LLC. X et YouTube sont des marques de leurs propriétaires respectifs.',
	'settings.versionBuilt': 'Version {version}, compilée le {date}',
	'settings.versionLoading': 'Chargement de la version…',
	'settings.checkUpdates': 'Rechercher des mises à jour',
	'settings.noUpdates': 'Aucune mise à jour disponible.',
	'update.checking': 'Recherche…',
	'update.available.title': 'Mise à jour disponible',
	'update.available.body':
		'La version {version} est prête à être installée. CleanMyPosts se ferme et se rouvre ensuite tout seul ; les opérations en cours sont interrompues.',
	'update.install': 'Installer et redémarrer',
	'update.later': 'Pas maintenant',
	'update.downloading': 'Téléchargement de la mise à jour {version}',
	'update.downloadingPercent': 'Téléchargement de la mise à jour {version} — {percent} %',
	'update.failed': "La mise à jour n'a pas pu être installée : {message}",
	'update.checkFailed': 'Impossible de rechercher des mises à jour : {message}',
	'settings.github': 'Projet sur GitHub',
	'settings.reportBug': 'Signaler un bug',
	'settings.licenses': 'Licences tierces',

	'info.title': 'Infos',
	'info.subtitle': 'Ce qu’est cette app, d’où elle vient et sur quoi elle repose.',
	'info.app.title': 'CleanMyPosts',
	'info.app.body':
		'Une app Windows qui vide ce que tu as publié, aimé et suivi, une plateforme à la fois. Elle procède comme toi : elle ouvre la page dans une fenêtre de navigateur et clique jusqu’à ce qu’il n’y ait plus rien à retirer.',
	'info.developer': 'Développeur',
	'info.version.title': 'Cette installation',
	'info.version.description': 'L’app télécharge et installe les mises à jour elle-même.',
	'info.links.title': 'Liens',
	'info.links.description': 'Tout est ouvert : le code, les bugs et ce sur quoi elle est bâtie.',
	'info.github.description': 'Les sources, les versions publiées et l’histoire derrière elles.',
	'info.reportBug.description':
		'Quelque chose n’a pas été supprimé, ou l’a été deux fois ? C’est ici.',
	'info.licenses.description':
		'Les bibliothèques open source livrées avec cette app, et leurs conditions.',
	'info.legal.title': 'Mentions légales',
	'info.troubleshooting.description':
		'Les échecs qui reviennent sans cesse, et quoi faire pour chacun.',

	'settings.general': 'Général',
	'settings.general.description':
		'Les pages que l’app propose. Masquer une plateforme ne t’en déconnecte pas.',
	'settings.notifications': 'Notifications',
	'settings.notifications.description':
		'Un court message à la fin d’une exécution. Il disparaît tout seul après une seconde.',
	'settings.autoConsent': 'Fermer les bandeaux de cookies',
	'settings.autoConsent.description':
		'Ferme les bandeaux de consentement automatiquement, en prenant le bouton de refus quand il y en a un.',
	'settings.actions': 'Actions enregistrées',
	'settings.actions.description':
		'Des plans écrits par l’assistant que tu as gardés. Chacun est un sélecteur, donc il cesse de fonctionner quand la plateforme bouge.',
	'settings.actions.empty':
		'Rien de gardé pour l’instant. Demande un plan à l’assistant et garde-le depuis là.',
	'settings.actions.made': '{platform} · gardé le {date}',
	'settings.actions.forget': 'Oublier',
	'settings.actions.forgetAll': 'Tout oublier',
	'settings.actions.forgetAll.confirmBody':
		'Cela jette {count} actions enregistrées. Impossible de les récupérer : la réponse dont elles venaient a disparu et la page a changé.',

	'settings.reset.title': 'Réinitialiser',
	'settings.reset.description': 'Remet tous les réglages dans l’état d’une nouvelle installation.',
	'settings.reset.action': 'Rétablir les valeurs par défaut',
	'settings.reset.confirmBody':
		'Tous les réglages reviennent à leur valeur par défaut, y compris le thème, la langue et l’assistant. Les sessions connectées et le journal ne sont pas touchés.',
	'settings.reset.done': 'Réglages réinitialisés',
	'settings.debugLogging': 'Journal détaillé',
	'settings.debugLogging.description':
		"Note ce que la page de la plateforme proposait réellement quand une suppression n'a pas abouti. Utile pour un rapport de bogue, bruyant sinon.",
	'settings.persistSession': 'Rester connecté',
	'settings.persistSession.description':
		'Conserver le cache et les cookies de WebView2 entre les lancements. Désactivé, tout est supprimé à chaque démarrage : X et YouTube s’ouvrent déconnectés.',
	'settings.checkUpdatesOnStart': 'Rechercher des mises à jour au démarrage',
	'settings.checkUpdatesOnStart.description':
		'Interroger la page des versions à chaque démarrage et le signaler dans l’aperçu lorsqu’une nouvelle existe. Désactivé, les mises à jour n’apparaissent que si vous appuyez sur le bouton de la page Infos.',
	'settings.automation': 'Automatisation',
	'settings.automation.description': 'Comment une exécution se comporte, et sur quoi elle clique.',
	'settings.engine': 'Moteur de suppression',
	'settings.engine.none': 'Comportement intégré',
	'settings.engine.active': 'Ton propre script, {count} lignes',
	'settings.engine.edit': 'Modifier',
	'settings.engine.reset': 'Réinitialiser',
	'settings.engine.save': 'Enregistrer',
	'settings.engine.hint':
		'S’exécute dans la page de la plateforme avant chaque action. `window.__cmp.config` contient tous les sélecteurs et tous les mots que le moteur cherche — change ce que ta langue ou ta région demande. Un script cassé ne coûte rien : il est attrapé, consigné, et le comportement intégré continue.',
	'settings.engine.placeholder': "window.__cmp.config.youtube.removeFromLikedText.push('…');",

	'assistant.report': 'Signaler un problème',
	'assistant.report.hint':
		"L'assistant transforme le journal en rapport de bogue. Vous le lisez, puis GitHub s'ouvre avec le formulaire prérempli — l'envoi reste votre clic, car un ticket est public.",
	'assistant.report.open': 'Signaler sur GitHub',
	'assistant.preview.report': 'Rapport de bogue',
	'assistant.mode': 'De quoi il retourne',
	'assistant.mode.question': 'Question',
	'assistant.patch': 'AI Repair (expérimental)',
	'assistant.patch.hint':
		"Quand une exécution ne supprime rien, la page est généralement formulée autrement que ce qu'attend l'application. Décrivez ce que vous voyez - l'entrée de menu, le bouton - et l'assistant écrit un petit script. Enregistré, il s'exécute dans la page de la plateforme avant chaque suppression : lisez-le d'abord.",
	'assistant.patch.apply': 'Enregistrer le correctif',
	'assistant.patch.applied': 'Enregistré. La prochaine exécution l’utilise.',
	'assistant.openInCli': 'Continuer dans Claude Code',
	'assistant.dismiss': 'Masquer',

	'header.url': 'Tu es ici',

	'log.column.time': 'Heure',
	'log.column.level': 'Niveau',
	'log.column.message': 'Message',
	'log.sortBy': 'Trier par {column}',

	'assistant.preview.source': 'Où est le code',
	'assistant.preview.structure': 'La page en ce moment',
	'assistant.preview.engine': 'Comment le moteur s’y prend',
	'assistant.preview.patch': 'La mission du correctif'
};
