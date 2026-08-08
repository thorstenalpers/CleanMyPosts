import type { MessageKey } from './en';

/** Typed against `MessageKey`, so a key added in English fails to compile until it lands here. */
export const es: Record<MessageKey, string> = {
	'app.tagline': 'Elimina publicaciones, me gusta y comentarios',

	'nav.overview': 'Resumen',
	'nav.log': 'Registro',
	'nav.assistant': 'Asistente',
	'nav.settings': 'Ajustes',
	'nav.info': 'Información',
	'nav.collapse': 'Contraer menú',
	'nav.expand': 'Expandir menú',

	'header.toDark': 'Cambiar al modo oscuro',
	'header.toLight': 'Cambiar al modo claro',
	'header.language': 'Idioma',

	'site.signedIn': 'Sesión iniciada',
	'site.signedOut': 'Sin sesión',
	'site.signInHint':
		'Inicia sesión en {platform} en el navegador junto a este panel para poder limpiar.',

	'action.show': 'Mostrar {label}',
	'action.delete': 'Eliminar todo: {label}',
	'action.deleteAll': 'Eliminar todo',
	'confirm.all.title': '¿Eliminar todo en {platform}?',
	'confirm.all.description':
		'Se vacían una tras otra, en {platform}: {lists}. Esto no se puede deshacer.',
	'run.allDone': '{count} elementos eliminados en total.',
	'run.allPartly': '{count} elementos eliminados, {failed} listas fallaron.',
	'action.close': 'Cerrar las acciones de {platform}',
	'action.open': 'Abrir las acciones de {platform}',

	'assistant.controls': 'Ajustes del asistente',
	'assistant.close': 'Cerrar el asistente',
	'assistant.effort': 'Esfuerzo',
	'assistant.effort.low': 'Breve',
	'assistant.effort.medium': 'Normal',
	'assistant.effort.high': 'A fondo',
	'assistant.model': 'Modelo',
	'assistant.model.default': 'Predeterminado del proveedor',
	'assistant.panel.empty':
		'Pide un plan para la página de al lado: qué quitar y cómo desaparece uno de ellos.',
	'assistant.noSource.short': 'Sin fuente',

	'assistant.plan.save': 'Guardar como acción',
	'assistant.plan.name': 'Nombre de esta acción',
	'assistant.plan.keep': 'Guardar',
	'assistant.plan.saved': 'Guardado — {label} ya está en las acciones',
	'panel.saved': 'Acciones guardadas',
	'confirm.saved.description':
		'Ejecuta {label}, un plan que el asistente escribió para {platform} tal como estaba entonces. No se puede deshacer.',
	'assistant.plan.count': 'Comprobar primero',
	'assistant.plan.run': 'Ejecutar una vez',
	'assistant.plan.matches': '{count} coincidencias en esta página',
	'assistant.plan.removed': '{count} eliminados',
	'assistant.plan.rejected': 'No es un plan — {reason}',
	'assistant.plan.noPlatform': 'Inicia sesión en una plataforma para probarlo aquí',
	'assistant.plan.label': 'Plan del asistente',

	'group.posts': 'Publicaciones',
	'group.replies': 'Respuestas',
	'group.reposts': 'Reposts',
	'group.likes': 'Me gusta',
	'group.following': 'Siguiendo',
	'group.comments': 'Comentarios',
	'plural.posts': 'publicaciones',
	'plural.replies': 'respuestas',
	'plural.reposts': 'reposts',
	'plural.likes': 'me gusta',
	'plural.following': 'cuentas seguidas',
	'plural.comments': 'comentarios',
	'plural.likedVideos': 'vídeos que te gustan',

	'confirm.title': '¿Eliminar todas las {plural}?',
	'confirm.description': 'Esto elimina todas tus {plural} en {platform}. No se puede deshacer.',
	'confirm.confirm': 'Eliminar',
	'confirm.cancel': 'Cancelar',

	'run.deleting': 'Eliminando {label}',
	'run.removedSoFar': '{count} eliminadas hasta ahora',
	'run.stop': 'Detener',
	'run.none': 'No se eliminó ninguna {plural}: no había nada que borrar.',
	'run.done': '{count} {plural} limpiadas.',
	'run.failed': 'La eliminación ha fallado.',

	'overview.title': 'Resumen',
	'overview.subtitle': 'Qué está conectado, qué se puede limpiar y qué se está ejecutando.',
	'overview.how.title': 'Cómo funciona',
	'overview.how.lead':
		'CleanMyPosts elimina tus propias publicaciones, me gusta y comentarios manejando una sesión real del navegador: los mismos clics que harías tú, solo que sin parar.',
	'overview.how.automation.title': 'Automatización del navegador, no una API.',
	'overview.how.automation.body':
		'La página de la plataforma se abre en una ventana del navegador dentro de esta app y se recorre a clics por ti. Sin cuenta de desarrollador, sin OAuth, sin clave de API: nada que una plataforma pueda revocar o limitar de forma distinta a como lo hace con una persona.',
	'overview.how.free.title': 'Gratis, y seguirá siéndolo.',
	'overview.how.free.body':
		'No hay cuenta, ni suscripción, ni versión de pago. Nada se cobra por eliminación porque no se cobra nada.',
	'overview.how.private.title': 'Nada sale de tu equipo.',
	'overview.how.private.body':
		'Tu sesión vive en el perfil del navegador que Windows ya guarda para esta app, igual que en un navegador. Tus publicaciones nunca se suben, copian ni almacenan: el único archivo que se escribe son los ajustes de esta app. La eliminación es lenta a propósito, con pausas que tú controlas, porque eso es lo que evita que parezca un bot.',
	'overview.how.dismiss': 'Entendido, no volver a mostrar',
	'overview.kinds': 'Se pueden eliminar {count} tipos de contenido.',
	'overview.open': 'Abrir {platform}',
	'overview.now.title': 'Ahora mismo',
	'overview.now.running': 'Eliminando {label}: {count} eliminadas hasta ahora.',
	'overview.now.idle': 'No se está ejecutando nada.',
	'overview.now.confirmOn': 'La confirmación antes de eliminar está activada.',
	'overview.now.confirmOff': 'La confirmación antes de eliminar está desactivada.',
	'overview.now.pause': 'Pausa entre eliminaciones: {count} ms.',

	'log.title': 'Registro',
	'log.errors': '{count} errores',
	'log.warnings': '{count} advertencias',
	'log.filter': 'Filtrar…',
	'log.filterLabel': 'Filtrar mensajes del registro',
	'log.levelLabel': 'Filtrar por nivel',
	'log.level.all': 'Todos',
	'log.level.debug': 'Depuración',
	'log.level.info': 'Información',
	'log.level.warning': 'Advertencia',
	'log.level.error': 'Error',
	'log.clear': 'Vaciar',
	'log.empty': 'Aún no hay nada registrado.',
	'log.noMatch': 'Ninguna entrada coincide con el filtro.',
	'log.jump': 'Ir a lo más reciente',

	'settings.title': 'Ajustes',
	'settings.subtitle': 'Los cambios se guardan sobre la marcha.',
	'settings.invalid': 'Valor de ajuste no válido.',

	'settings.appearance': 'Apariencia',
	'settings.appearance.description': 'Cómo se ve la app en este equipo.',
	'settings.mode': 'Modo',
	'settings.mode.description': 'Seguir a Windows o fijar un modo.',
	'settings.mode.light': 'Claro',
	'settings.mode.dark': 'Oscuro',
	'settings.mode.system': 'Sistema',
	'settings.colour': 'Color',
	'settings.colour.description':
		'Solo cambia el acento. El rojo queda reservado para la eliminación.',
	'settings.language': 'Idioma',
	'settings.language.description': 'Seguir a Windows o fijar un idioma.',
	'settings.language.system': 'Sistema',

	'settings.navigation': 'Navegación',
	'settings.navigation.description':
		'Qué ofrece la barra lateral. Ocultar una plataforma no cierra su sesión.',
	'settings.showX': 'Mostrar X',
	'settings.showX.description': 'Publicaciones, respuestas, reposts, me gusta, siguiendo.',
	'settings.showYouTube': 'Mostrar YouTube',
	'settings.showYouTube.description': 'Comentarios y vídeos que te gustan.',
	'settings.showIntro': 'Mostrar la información',
	'settings.showIntro.description': 'El panel del resumen que explica cómo funciona la app.',
	'settings.showLog': 'Mostrar el registro',
	'settings.showLog.description': 'Un registro en vivo de cada acción, como página propia.',
	'settings.showAssistant': 'Mostrar el asistente',
	'settings.showAssistant.description':
		'Una página que responde preguntas sobre la app y sobre el registro.',

	'settings.safety': 'Seguridad',
	'settings.safety.description':
		'Las eliminaciones no se pueden deshacer. Esto decide con cuánta insistencia se te pregunta.',
	'settings.confirm': 'Confirmar antes de eliminar',
	'settings.confirm.description': 'Preguntar una vez por ejecución.',

	'settings.timing': 'Tiempos',
	'settings.timing.description':
		'Subir estos valores siempre es seguro. Bajarlos acelera la eliminación, pero hace más probable que se detecte como automatización.',
	'settings.timing.afterLoad': 'Tras cargar una página',
	'settings.timing.afterLoad.description':
		'Cuánto se deja asentar la página antes de la primera eliminación.',
	'settings.timing.betweenDeletes': 'Entre eliminaciones',
	'settings.timing.betweenDeletes.description':
		'Pausa después de cada elemento eliminado. El freno principal contra la detección de automatización.',
	'settings.timing.betweenRetries': 'Entre reintentos',
	'settings.timing.betweenRetries.description':
		'Pausa antes de reintentar un elemento que no desapareció.',

	'settings.assistant': 'Asistente',
	'settings.assistant.description':
		'De dónde vienen las respuestas. El binario local no envía nada desde esta app; un proveedor alojado es lo único aquí que pone datos en la red.',
	'settings.assistant.source': 'Origen',
	'settings.assistant.off': 'Desactivado',
	'settings.assistant.off.description':
		'El asistente está desactivado y no aparece en la barra lateral.',
	'settings.assistant.local': 'Claude Code en este equipo',
	'settings.assistant.hosted': 'Un proveedor alojado',
	'settings.assistant.cliPath': 'Ruta al binario',
	'settings.assistant.cliPath.description':
		'Déjalo vacío para buscar donde Claude Code se instala a sí mismo.',
	'settings.assistant.cliPath.placeholder': 'claude.exe',
	'settings.assistant.cliFound': 'Encontrado: {version}',
	'settings.assistant.cliMissing': 'No se ha encontrado en este equipo.',
	'settings.assistant.provider': 'Proveedor',
	'settings.assistant.provider.description': 'Qué modelo alojado responde, y su clave de API.',
	'settings.assistant.keys': 'Claves de API',
	'settings.assistant.keys.title': 'Claves de API',
	'settings.assistant.keys.description':
		'Las claves van al Administrador de credenciales de Windows, nunca a un archivo de esta app. Una clave no se puede volver a leer: solo reemplazar u olvidar.',
	'settings.assistant.keys.placeholder': 'Pega una clave para guardarla',
	'settings.assistant.keys.stored': 'Guardada',
	'settings.assistant.keys.saved': 'Aplicada',
	'settings.assistant.keys.none': 'Sin clave',
	'settings.assistant.keys.free': 'Consigue una clave gratis',
	'settings.assistant.keys.forget': 'Olvidar',
	'settings.assistant.keys.close': 'Listo',

	'assistant.title': 'Asistente',
	'assistant.subtitle': 'Preguntas sobre lo que hace esta app y sobre lo que dice el registro.',
	'assistant.placeholder.patch':
		'En mi página la opción del menú dice «Quitar de Vídeos que me gustan»',
	'assistant.placeholder.report':
		'El borrado de me gusta se detuvo tras tres vídeos y el menú se cerró solo',
	'assistant.placeholder': '¿Por qué no se eliminaron 12 publicaciones?',
	'assistant.ask': 'Preguntar',
	'assistant.asking': 'Preguntando…',
	'assistant.noSource':
		'Aún no hay ningún origen configurado. Elige uno en los ajustes: Claude Code en este equipo, o la clave de un proveedor.',
	'assistant.openSettings': 'Abrir los ajustes',
	'assistant.sendsLog':
		'La pregunta se envía junto con el registro y una descripción de la app. El registro nunca contiene contenido de publicaciones, nombres de cuenta ni cookies.',
	'assistant.clear': 'Vaciar',
	'assistant.troubleshooting': 'Solución de problemas',
	'assistant.troubleshooting.hint':
		'La mayoría de los fallos tienen una causa conocida y una solución conocida. La guía los enumera — y a este asistente se le entrega esa misma lista junto con tu registro.',
	'assistant.preview.show': 'Ver lo que se envía',
	'assistant.preview.hide': 'Ocultar lo que se envía',
	'assistant.preview.description':
		'La petición, tal cual saldría de este equipo. No se añade nada más.',
	'assistant.preview.role': 'Instrucciones',
	'assistant.preview.app': 'Sobre la app',
	'assistant.preview.fixes': 'Fallos conocidos y soluciones',
	'assistant.preview.log': 'El registro',
	'assistant.preview.question': 'Tu pregunta',
	'assistant.preview.noQuestion': 'Escribe una pregunta arriba para verla aquí.',

	'settings.about': 'Acerca de',
	'settings.about.description':
		'Sin afiliación, respaldo ni patrocinio de X Corp. ni de Google LLC. X y YouTube son marcas de sus respectivos propietarios.',
	'settings.versionBuilt': 'Versión {version}, compilada el {date}',
	'settings.versionLoading': 'Cargando la versión…',
	'settings.checkUpdates': 'Buscar actualizaciones',
	'settings.noUpdates': 'No hay actualizaciones disponibles.',
	'update.checking': 'Buscando…',
	'update.available.title': 'Actualización disponible',
	'update.available.body':
		'La versión {version} está lista para instalarse. CleanMyPosts se cierra y se vuelve a abrir solo cuando termina; lo que esté en marcha se detiene.',
	'update.install': 'Instalar y reiniciar',
	'update.later': 'Ahora no',
	'update.downloading': 'Descargando la actualización {version}',
	'update.downloadingPercent': 'Descargando la actualización {version} — {percent} %',
	'update.failed': 'No se pudo instalar la actualización: {message}',
	'update.checkFailed': 'No se pudo buscar actualizaciones: {message}',
	'settings.github': 'Proyecto en GitHub',
	'settings.reportBug': 'Informar de un error',
	'settings.licenses': 'Licencias de terceros',

	'info.title': 'Información',
	'info.subtitle': 'Qué es esta app, de dónde viene y sobre qué está construida.',
	'info.app.title': 'CleanMyPosts',
	'info.app.body':
		'Una app de Windows que vacía lo que has publicado, marcado con me gusta y seguido, una plataforma cada vez. Trabaja como lo harías tú: abre la página en una ventana del navegador y va haciendo clic hasta que no queda nada por quitar.',
	'info.developer': 'Desarrollador',
	'info.version.title': 'Esta instalación',
	'info.version.description': 'La propia app descarga e instala las actualizaciones.',
	'info.links.title': 'Enlaces',
	'info.links.description': 'Todo está a la vista: el código, los fallos y sus cimientos.',
	'info.github.description': 'El código fuente, las versiones y la historia detrás de ellas.',
	'info.reportBug.description': '¿Algo no se borró, o se borró dos veces? Aquí es donde va.',
	'info.licenses.description':
		'Las bibliotecas de código abierto que incluye esta app, y sus términos.',
	'info.legal.title': 'Aviso legal',
	'info.troubleshooting.description':
		'Los fallos que aparecen una y otra vez, y qué hacer con cada uno.',

	'settings.general': 'General',
	'settings.general.description':
		'Qué páginas ofrece la app. Ocultar una plataforma no cierra su sesión.',
	'settings.notifications': 'Notificaciones',
	'settings.notifications.description':
		'Un aviso corto cuando termina una ejecución. Desaparece solo al cabo de un segundo.',
	'settings.autoConsent': 'Cerrar avisos de cookies',
	'settings.autoConsent.description':
		'Cierra los avisos de consentimiento automáticamente, usando el botón de rechazo cuando el aviso ofrece uno.',
	'settings.actions': 'Acciones guardadas',
	'settings.actions.description':
		'Planes que escribió el asistente y que has guardado. Cada uno es un selector, así que deja de funcionar cuando la plataforma cambia.',
	'settings.actions.empty':
		'Todavía no has guardado nada. Pide un plan al asistente y guárdalo desde allí.',
	'settings.actions.made': '{platform} · guardado el {date}',
	'settings.actions.forget': 'Olvidar',
	'settings.actions.forgetAll': 'Olvidar todo',
	'settings.actions.forgetAll.confirmBody':
		'Esto descarta {count} acciones guardadas. No se pueden recuperar: la respuesta de la que salieron ya no está y la página ha cambiado.',

	'settings.reset.title': 'Restablecer',
	'settings.reset.description': 'Devuelve todos los ajustes al estado de una instalación nueva.',
	'settings.reset.action': 'Restablecer valores',
	'settings.reset.confirmBody':
		'Todos los ajustes vuelven a su valor predeterminado, incluidos el tema, el idioma y el asistente. Las sesiones iniciadas y el registro no se tocan.',
	'settings.reset.done': 'Ajustes restablecidos',
	'settings.debugLogging': 'Registro detallado',
	'settings.debugLogging.description':
		'Anota lo que la página de la plataforma ofreció realmente cuando un borrado no encontró el camino. Útil para un informe de error, ruidoso en el resto de casos.',
	'settings.persistSession': 'Mantener la sesión',
	'settings.persistSession.description':
		'Conservar la caché y las cookies de WebView2 entre inicios. Desactivado las descarta en cada arranque, así que X y YouTube se abren sin sesión.',
	'settings.checkUpdatesOnStart': 'Buscar actualizaciones al iniciar',
	'settings.checkUpdatesOnStart.description':
		'Preguntar a la página de versiones por una más reciente cada vez que la aplicación arranca y avisarlo en el resumen cuando la haya. Desactivado, las actualizaciones solo aparecen si pulsas el botón de la página Información.',
	'settings.automation': 'Automatización',
	'settings.automation.description': 'Cómo se comporta una ejecución y en qué hace clic.',
	'settings.engine': 'Motor de borrado',
	'settings.engine.none': 'Comportamiento integrado',
	'settings.engine.active': 'Tu propio script, {count} líneas',
	'settings.engine.edit': 'Editar',
	'settings.engine.reset': 'Restablecer',
	'settings.engine.save': 'Guardar',
	'settings.engine.hint':
		'Se ejecuta en la página de la plataforma antes de cada acción. `window.__cmp.config` contiene todos los selectores y todas las palabras que busca el motor: cambia lo que necesite tu idioma o tu región. Un script roto no cuesta nada: se captura, se registra y sigue el comportamiento integrado.',
	'settings.engine.placeholder': "window.__cmp.config.youtube.removeFromLikedText.push('…');",

	'assistant.report': 'Informar de un problema',
	'assistant.report.hint':
		'El asistente convierte el registro en un informe de error. Lo lees y luego se abre GitHub con el formulario relleno: enviarlo sigue siendo tu clic, porque una incidencia es pública.',
	'assistant.report.open': 'Informar en GitHub',
	'assistant.preview.report': 'Informe de error',
	'assistant.mode': 'De qué trata esta solicitud',
	'assistant.mode.question': 'Pregunta',
	'assistant.patch': 'AI Repair (experimental)',
	'assistant.patch.hint':
		'Cuando una ejecución no elimina nada, la página suele estar redactada de forma distinta a la que espera la aplicación. Describe lo que ves - la opción del menú, el botón - y el asistente escribirá un pequeño script. Guardado, se ejecuta dentro de la página de la plataforma antes de cada borrado, así que léelo primero.',
	'assistant.patch.apply': 'Guardar el ajuste',
	'assistant.patch.applied': 'Guardado. La próxima ejecución lo usa.',
	'assistant.openInCli': 'Continuar en Claude Code',
	'assistant.dismiss': 'Ocultar',

	'header.url': 'Estás aquí',

	'log.column.time': 'Hora',
	'log.column.level': 'Nivel',
	'log.column.message': 'Mensaje',
	'log.sortBy': 'Ordenar por {column}',

	'assistant.preview.source': 'Dónde está el código',
	'assistant.preview.structure': 'La página ahora mismo',
	'assistant.preview.engine': 'Cómo lo hace el motor',
	'assistant.preview.patch': 'El encargo del parche'
};
