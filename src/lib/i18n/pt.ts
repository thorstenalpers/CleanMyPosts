import type { MessageKey } from './en';

/** Typed against `MessageKey`, so a key added in English fails to compile until it lands here. */
export const pt: Record<MessageKey, string> = {
	'app.tagline': 'Elimina publicações, gostos e comentários',

	'nav.overview': 'Visão geral',
	'nav.log': 'Registo',
	'nav.assistant': 'Assistente',
	'nav.settings': 'Definições',
	'nav.info': 'Informações',
	'nav.collapse': 'Recolher o menu',
	'nav.expand': 'Expandir o menu',

	'header.toDark': 'Mudar para o modo escuro',
	'header.toLight': 'Mudar para o modo claro',
	'header.language': 'Idioma',

	'site.signedIn': 'Sessão iniciada',
	'site.signedOut': 'Sem sessão',
	'site.signInHint':
		'Inicia sessão no {platform} no navegador ao lado deste painel para poderes limpar.',

	'action.show': 'Mostrar {label}',
	'action.delete': 'Eliminar tudo: {label}',
	'action.deleteAll': 'Eliminar tudo',
	'confirm.all.title': 'Eliminar tudo no {platform}?',
	'confirm.all.description':
		'Esvaziados um após o outro, no {platform}: {lists}. Isto não pode ser anulado.',
	'run.allDone': '{count} itens eliminados no total.',
	'run.allPartly': '{count} itens eliminados, {failed} listas falharam.',
	'action.close': 'Fechar as ações do {platform}',
	'action.open': 'Abrir as ações do {platform}',

	'group.posts': 'Publicações',
	'group.replies': 'Respostas',
	'group.reposts': 'Reposts',
	'group.likes': 'Gostos',
	'group.following': 'A seguir',
	'group.comments': 'Comentários',
	'plural.posts': 'publicações',
	'plural.replies': 'respostas',
	'plural.reposts': 'reposts',
	'plural.likes': 'gostos',
	'plural.following': 'contas seguidas',
	'plural.comments': 'comentários',
	'plural.likedVideos': 'vídeos com gosto',

	'confirm.title': 'Eliminar todas as {plural}?',
	'confirm.description': 'Isto remove todas as tuas {plural} no {platform}. Não pode ser desfeito.',
	'confirm.confirm': 'Eliminar',
	'confirm.cancel': 'Cancelar',

	'run.deleting': 'A eliminar {label}',
	'run.removedSoFar': '{count} removidas até agora',
	'run.stop': 'Parar',
	'run.none': 'Nenhuma {plural} removida — não havia nada para eliminar.',
	'run.done': '{count} {plural} limpas.',
	'run.failed': 'A eliminação falhou.',

	'overview.title': 'Visão geral',
	'overview.subtitle': 'O que está ligado, o que pode ser limpo e o que está a correr.',
	'overview.how.title': 'Como isto funciona',
	'overview.how.lead':
		'O CleanMyPosts elimina as tuas publicações, gostos e comentários conduzindo uma sessão real de navegador — os mesmos cliques que farias, só que sem parar.',
	'overview.how.automation.title': 'Automação de navegador, não uma API.',
	'overview.how.automation.body':
		'A página da plataforma é aberta numa janela de navegador dentro desta app e percorrida a cliques por ti. Sem conta de programador, sem OAuth, sem chave de API — nada que uma plataforma possa revogar ou limitar de forma diferente do que faz a uma pessoa.',
	'overview.how.free.title': 'Gratuito, e continua a sê-lo.',
	'overview.how.free.body':
		'Não há conta, nem subscrição, nem versão paga. Nada é cobrado por eliminação porque nada é cobrado.',
	'overview.how.private.title': 'Nada sai do teu computador.',
	'overview.how.private.body':
		'A tua sessão vive no perfil de navegador que o Windows já guarda para esta app, tal como num navegador. As tuas publicações nunca são enviadas, copiadas ou guardadas — o único ficheiro escrito são as definições desta app. A eliminação é lenta de propósito, com pausas que controlas, porque é isso que a impede de parecer um bot.',
	'overview.how.dismiss': 'Percebi — não mostrar de novo',
	'overview.kinds': 'Podem ser removidos {count} tipos de conteúdo.',
	'overview.open': 'Abrir {platform}',
	'overview.now.title': 'Neste momento',
	'overview.now.running': 'A eliminar {label} — {count} removidas até agora.',
	'overview.now.idle': 'Não está nada a correr.',
	'overview.now.confirmOn': 'A confirmação antes de eliminar está ligada.',
	'overview.now.confirmOff': 'A confirmação antes de eliminar está desligada.',
	'overview.now.pause': 'Pausa entre eliminações: {count} ms.',

	'log.title': 'Registo',
	'log.errors': '{count} erros',
	'log.warnings': '{count} avisos',
	'log.filter': 'Filtrar…',
	'log.filterLabel': 'Filtrar mensagens do registo',
	'log.levelLabel': 'Filtrar por nível',
	'log.level.all': 'Todos',
	'log.level.debug': 'Depuração',
	'log.level.info': 'Info',
	'log.level.warning': 'Aviso',
	'log.level.error': 'Erro',
	'log.clear': 'Limpar',
	'log.empty': 'Ainda não há nada registado.',
	'log.noMatch': 'Nenhuma entrada corresponde ao filtro.',
	'log.jump': 'Ir para a mais recente',

	'settings.title': 'Definições',
	'settings.subtitle': 'As alterações são guardadas à medida que as fazes.',
	'settings.invalid': 'Valor inválido.',

	'settings.appearance': 'Aspeto',
	'settings.appearance.description': 'Como a app se vê neste computador.',
	'settings.mode': 'Modo',
	'settings.mode.description': 'Seguir o Windows ou fixar um modo.',
	'settings.mode.light': 'Claro',
	'settings.mode.dark': 'Escuro',
	'settings.mode.system': 'Sistema',
	'settings.colour': 'Cor',
	'settings.colour.description': 'Só o realce muda. O vermelho fica reservado à eliminação.',
	'settings.language': 'Idioma',
	'settings.language.description': 'Seguir o Windows ou fixar um idioma.',
	'settings.language.system': 'Sistema',

	'settings.navigation': 'Navegação',
	'settings.navigation.description':
		'O que a barra lateral oferece. Esconder uma plataforma não termina a tua sessão nela.',
	'settings.showX': 'Mostrar o X',
	'settings.showX.description': 'Publicações, respostas, reposts, gostos, a seguir.',
	'settings.showYouTube': 'Mostrar o YouTube',
	'settings.showYouTube.description': 'Comentários e vídeos com gosto.',
	'settings.showIntro': 'Mostrar as informações',
	'settings.showIntro.description': 'O painel na visão geral que explica como a app funciona.',
	'settings.showLog': 'Mostrar o registo',
	'settings.showLog.description': 'Um registo ao vivo de cada ação, como página própria.',
	'settings.showAssistant': 'Mostrar o assistente',
	'settings.showAssistant.description':
		'Uma página que responde a perguntas sobre a app e sobre o registo.',

	'settings.safety': 'Segurança',
	'settings.safety.description':
		'As eliminações não podem ser desfeitas. Isto decide com que insistência te é perguntado.',
	'settings.confirm': 'Confirmar antes de eliminar',
	'settings.confirm.description': 'Perguntar uma vez por execução.',

	'settings.timing': 'Tempos',
	'settings.timing.description':
		'Aumentar estes valores é sempre seguro. Baixá-los torna a eliminação mais rápida, mas mais provável de ser marcada como automação.',
	'settings.timing.afterLoad': 'Depois de uma página carregar',
	'settings.timing.afterLoad.description':
		'Quanto tempo deixar a página assentar antes da primeira eliminação.',
	'settings.timing.betweenDeletes': 'Entre eliminações',
	'settings.timing.betweenDeletes.description':
		'Pausa após cada item removido. O travão principal contra a deteção de automação.',
	'settings.timing.betweenRetries': 'Entre tentativas',
	'settings.timing.betweenRetries.description':
		'Pausa antes de tentar de novo um item que não desapareceu.',

	'settings.assistant': 'Assistente',
	'settings.assistant.description':
		'De onde vêm as respostas. O binário local não envia nada desta app; um fornecedor alojado é a única coisa aqui que põe dados na rede.',
	'settings.assistant.source': 'Origem',
	'settings.assistant.off': 'Desligado',
	'settings.assistant.off.description':
		'O assistente está desligado e não aparece na barra lateral.',
	'settings.assistant.local': 'Claude Code neste computador',
	'settings.assistant.hosted': 'Um fornecedor alojado',
	'settings.assistant.cliPath': 'Caminho do binário',
	'settings.assistant.cliPath.description':
		'Deixa vazio para procurar onde o Claude Code se instala.',
	'settings.assistant.cliPath.placeholder': 'claude.exe',
	'settings.assistant.cliFound': 'Encontrado: {version}',
	'settings.assistant.cliMissing': 'Não encontrado neste computador.',
	'settings.assistant.provider': 'Fornecedor',
	'settings.assistant.provider.description': 'Que modelo alojado responde, e a sua chave de API.',
	'settings.assistant.keys': 'Chaves de API',
	'settings.assistant.keys.title': 'Chaves de API',
	'settings.assistant.keys.description':
		'As chaves vão para o Gestor de Credenciais do Windows, nunca para um ficheiro desta app. Uma chave não pode ser lida de volta — só substituída ou esquecida.',
	'settings.assistant.keys.placeholder': 'Cola uma chave para a guardar',
	'settings.assistant.keys.stored': 'Guardada',
	'settings.assistant.keys.saved': 'Aplicada',
	'settings.assistant.keys.none': 'Sem chave',
	'settings.assistant.keys.free': 'Obter uma chave gratuita',
	'settings.assistant.keys.forget': 'Esquecer',
	'settings.assistant.keys.close': 'Concluído',

	'assistant.title': 'Assistente',
	'assistant.subtitle': 'Perguntas sobre o que esta app faz e sobre o que diz o registo.',
	'assistant.placeholder.patch':
		'Na minha página a opção do menu diz «Remover dos vídeos que gostei»',
	'assistant.placeholder.report':
		'A eliminação dos gostos parou após três vídeos e o menu fechou sozinho',
	'assistant.placeholder': 'Porque é que 12 publicações não foram eliminadas?',
	'assistant.ask': 'Perguntar',
	'assistant.asking': 'A perguntar…',
	'assistant.noSource':
		'Ainda não há nenhuma origem configurada. Escolhe uma nas definições — Claude Code neste computador, ou a chave de um fornecedor.',
	'assistant.openSettings': 'Abrir as definições',
	'assistant.sendsLog':
		'A pergunta é enviada juntamente com o registo e uma descrição da app. O registo nunca contém conteúdo de publicações, nomes de utilizador ou cookies.',
	'assistant.clear': 'Limpar',
	'assistant.troubleshooting': 'Resolução de problemas',
	'assistant.troubleshooting.hint':
		'A maioria das falhas tem uma causa conhecida e uma solução conhecida. O guia enumera-as — e este assistente recebe essa mesma lista juntamente com o teu registo.',
	'assistant.preview.show': 'Ver o que é enviado',
	'assistant.preview.hide': 'Ocultar o que é enviado',
	'assistant.preview.description':
		'O pedido, tal como sairia deste computador. Nada mais é acrescentado.',
	'assistant.preview.role': 'Instruções',
	'assistant.preview.app': 'Sobre a app',
	'assistant.preview.fixes': 'Falhas conhecidas e soluções',
	'assistant.preview.log': 'O registo',
	'assistant.preview.question': 'A tua pergunta',
	'assistant.preview.noQuestion': 'Escreve uma pergunta acima para a veres aqui.',

	'settings.about': 'Sobre',
	'settings.about.description':
		'Sem afiliação, apoio ou patrocínio da X Corp. ou da Google LLC. X e YouTube são marcas dos respetivos proprietários.',
	'settings.versionBuilt': 'Versão {version}, compilada a {date}',
	'settings.versionLoading': 'A carregar a versão…',
	'settings.checkUpdates': 'Procurar atualizações',
	'settings.noUpdates': 'Não há atualizações disponíveis.',
	'update.checking': 'A procurar…',
	'update.available.title': 'Atualização disponível',
	'update.available.body':
		'A versão {version} está pronta a instalar. No fim, o CleanMyPosts fecha-se e volta a abrir sozinho; o que estiver a decorrer é interrompido.',
	'update.install': 'Instalar e reiniciar',
	'update.later': 'Agora não',
	'update.downloading': 'A transferir a atualização {version}',
	'update.downloadingPercent': 'A transferir a atualização {version} — {percent} %',
	'update.failed': 'Não foi possível instalar a atualização: {message}',
	'update.checkFailed': 'Não foi possível procurar atualizações: {message}',
	'settings.github': 'Projeto no GitHub',
	'settings.reportBug': 'Comunicar um erro',
	'settings.licenses': 'Licenças de terceiros',

	'info.title': 'Informações',
	'info.subtitle': 'O que é esta app, de onde vem e sobre o que é construída.',
	'info.app.title': 'CleanMyPosts',
	'info.app.body':
		'Uma app de Windows que esvazia o que publicaste, gostaste e seguiste, uma plataforma de cada vez. Funciona como tu funcionarias: abre a página numa janela de navegador e vai clicando até não sobrar nada para remover.',
	'info.developer': 'Programador',
	'info.version.title': 'Esta instalação',
	'info.version.description': 'As atualizações são descarregadas e instaladas pela própria app.',
	'info.links.title': 'Ligações',
	'info.links.description': 'Está tudo à vista: o código, os problemas e os seus alicerces.',
	'info.github.description': 'O código-fonte, as versões e a história por trás delas.',
	'info.reportBug.description': 'Algo não foi eliminado, ou foi eliminado duas vezes? É por aqui.',
	'info.licenses.description':
		'As bibliotecas de código aberto que esta app inclui, e os seus termos.',
	'info.legal.title': 'Aviso legal',
	'info.troubleshooting.description':
		'As falhas que aparecem vezes sem conta, e o que fazer em cada uma.',

	'settings.general': 'Geral',
	'settings.general.description':
		'Que páginas a app oferece. Esconder uma plataforma não termina a tua sessão nela.',
	'settings.notifications': 'Notificações',
	'settings.notifications.description':
		'Uma mensagem curta quando uma execução acaba. Desaparece sozinha ao fim de um segundo.',
	'settings.autoConsent': 'Fechar avisos de cookies',
	'settings.autoConsent.description':
		'Fecha os avisos de consentimento sozinha, usando o botão que recusa sempre que o aviso tem um.',
	'settings.reset.title': 'Repor',
	'settings.reset.description': 'Coloca todas as definições no estado de uma instalação nova.',
	'settings.reset.action': 'Repor predefinições',
	'settings.reset.confirmBody':
		'Todas as definições voltam ao valor predefinido, incluindo o tema, o idioma e o assistente. As sessões iniciadas e o registo não são alterados.',
	'settings.reset.done': 'Definições repostas',
	'settings.debugLogging': 'Registo detalhado',
	'settings.debugLogging.description':
		'Regista o que a página da plataforma ofereceu de facto quando uma eliminação não encontrou caminho. Útil para um relatório de erro, ruidoso nos restantes casos.',
	'settings.persistSession': 'Manter a sessão',
	'settings.persistSession.description':
		'Conservar a cache e os cookies do WebView2 entre inicializações. Desligado descarta tudo em cada arranque, por isso o X e o YouTube abrem sem sessão.',
	'settings.checkUpdatesOnStart': 'Procurar atualizações ao iniciar',
	'settings.checkUpdatesOnStart.description':
		'Perguntar à página de versões por uma mais recente sempre que a aplicação arranca e avisar na visão geral quando existir. Desligado, as atualizações só aparecem se carregar no botão da página Informações.',
	'settings.automation': 'Automação',
	'settings.automation.description': 'Como uma execução se comporta e em que clica.',
	'settings.engine': 'Motor de eliminação',
	'settings.engine.none': 'Comportamento incorporado',
	'settings.engine.active': 'O teu script, {count} linhas',
	'settings.engine.edit': 'Editar',
	'settings.engine.reset': 'Repor',
	'settings.engine.save': 'Guardar',
	'settings.engine.hint':
		'Corre na página da plataforma antes de cada ação. `window.__cmp.config` tem todos os seletores e todas as palavras que o motor procura — muda o que o teu idioma ou a tua região precisa. Um script partido não custa nada: é apanhado, registado, e o comportamento incorporado segue.',
	'settings.engine.placeholder': "window.__cmp.config.youtube.removeFromLikedText.push('…');",

	'assistant.report': 'Comunicar um problema',
	'assistant.report.hint':
		'O assistente transforma o registo num relatório de erro. Lês o texto e o GitHub abre com o formulário preenchido — enviar continua a ser o teu clique, porque uma issue é pública.',
	'assistant.report.open': 'Comunicar no GitHub',
	'assistant.preview.report': 'Relatório de erro',
	'assistant.mode': 'Do que trata este pedido',
	'assistant.mode.question': 'Pergunta',
	'assistant.patch': 'AI Repair (experimental)',
	'assistant.patch.hint':
		'Quando uma execução não elimina nada, a página costuma estar redigida de forma diferente da esperada pela aplicação. Descreve o que vês - a opção do menu, o botão - e o assistente escreve um pequeno script. Depois de guardado, corre dentro da página da plataforma antes de cada eliminação, por isso lê-o primeiro.',
	'assistant.patch.apply': 'Guardar a correção',
	'assistant.patch.applied': 'Guardado. A próxima execução usa-o.',
	'assistant.openInCli': 'Continuar no Claude Code',
	'assistant.dismiss': 'Esconder',

	'header.url': 'Estás aqui',

	'log.column.time': 'Hora',
	'log.column.level': 'Nível',
	'log.column.message': 'Mensagem',
	'log.sortBy': 'Ordenar por {column}',

	'assistant.preview.source': 'Onde está o código',
	'assistant.preview.patch': 'A tarefa do patch'
};
