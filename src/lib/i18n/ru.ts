import type { MessageKey } from './en';

/** Typed against `MessageKey`, so a key added in English fails to compile until it lands here. */
export const ru: Record<MessageKey, string> = {
	'app.tagline': 'Удаляет посты, лайки и комментарии',

	'nav.overview': 'Обзор',
	'nav.log': 'Журнал',
	'nav.assistant': 'Ассистент',
	'nav.settings': 'Настройки',
	'nav.info': 'Сведения',
	'nav.collapse': 'Свернуть меню',
	'nav.expand': 'Развернуть меню',

	'header.toDark': 'Перейти в тёмный режим',
	'header.toLight': 'Перейти в светлый режим',
	'header.language': 'Язык',

	'site.signedIn': 'Вход выполнен',
	'site.signedOut': 'Вход не выполнен',
	'site.signInHint':
		'Войдите в {platform} в браузере рядом с этой панелью, чтобы можно было очищать.',

	'action.show': 'Показать: {label}',
	'action.delete': 'Удалить всё: {label}',
	'action.deleteAll': 'Удалить всё',
	'confirm.all.title': 'Удалить всё в {platform}?',
	'confirm.all.description': 'Будут очищены по очереди в {platform}: {lists}. Отменить это нельзя.',
	'run.allDone': 'Всего удалено: {count}.',
	'run.allPartly': 'Удалено {count}, списков с ошибкой: {failed}.',
	'action.close': 'Закрыть действия {platform}',

	'group.posts': 'Посты',
	'group.replies': 'Ответы',
	'group.reposts': 'Репосты',
	'group.likes': 'Лайки',
	'group.following': 'Подписки',
	'group.comments': 'Комментарии',
	'plural.posts': 'постов',
	'plural.replies': 'ответов',
	'plural.reposts': 'репостов',
	'plural.likes': 'лайков',
	'plural.following': 'подписок',
	'plural.comments': 'комментариев',
	'plural.likedVideos': 'понравившихся видео',

	'confirm.title': 'Удалить все {plural}?',
	'confirm.description': 'Это удалит все ваши {plural} в {platform}. Отменить это нельзя.',
	'confirm.confirm': 'Удалить',
	'confirm.cancel': 'Отмена',

	'run.deleting': 'Удаление: {label}',
	'run.removedSoFar': 'удалено: {count}',
	'run.stop': 'Стоп',
	'run.none': 'Ничего не удалено — {plural} для удаления не нашлось.',
	'run.done': 'Очищено {plural}: {count}.',
	'run.failed': 'Удаление не удалось.',

	'overview.title': 'Обзор',
	'overview.subtitle': 'Что подключено, что можно очистить и что выполняется.',
	'overview.how.title': 'Как это работает',
	'overview.how.lead':
		'CleanMyPosts удаляет ваши посты, лайки и комментарии, управляя настоящей сессией браузера — теми же кликами, что сделали бы вы сами, только без остановок.',
	'overview.how.automation.title': 'Автоматизация браузера, а не API.',
	'overview.how.automation.body':
		'Страница платформы открывается в окне браузера внутри этого приложения, и по ней кликают за вас. Ни аккаунта разработчика, ни OAuth, ни ключа API — ничего, что платформа могла бы отозвать или ограничить иначе, чем для человека.',
	'overview.how.free.title': 'Бесплатно — и так и останется.',
	'overview.how.free.body':
		'Нет ни аккаунта, ни подписки, ни платного тарифа. За удаление ничего не берут, потому что не берут вообще ничего.',
	'overview.how.private.title': 'Ничего не покидает ваш компьютер.',
	'overview.how.private.body':
		'Ваш вход хранится в том профиле браузера, который Windows и так ведёт для этого приложения, ровно как в обычном браузере. Ваши посты никогда не выгружаются, не копируются и не сохраняются — единственный записываемый файл это настройки самого приложения. Удаление намеренно медленное, с паузами, которые задаёте вы, потому что именно это не даёт ему выглядеть ботом.',
	'overview.how.dismiss': 'Понятно — больше не показывать',
	'overview.kinds': 'Можно удалить типов контента: {count}.',
	'overview.open': 'Открыть {platform}',
	'overview.now.title': 'Прямо сейчас',
	'overview.now.running': 'Удаление: {label} — удалено {count}.',
	'overview.now.idle': 'Ничего не выполняется.',
	'overview.now.confirmOn': 'Подтверждение перед удалением включено.',
	'overview.now.confirmOff': 'Подтверждение перед удалением выключено.',
	'overview.now.pause': 'Пауза между удалениями: {count} мс.',

	'log.title': 'Журнал',
	'log.errors': 'ошибок: {count}',
	'log.warnings': 'предупреждений: {count}',
	'log.filter': 'Фильтр…',
	'log.filterLabel': 'Фильтровать сообщения журнала',
	'log.levelLabel': 'Фильтр по уровню',
	'log.level.all': 'Все',
	'log.level.debug': 'Отладка',
	'log.level.info': 'Инфо',
	'log.level.warning': 'Предупреждение',
	'log.level.error': 'Ошибка',
	'log.clear': 'Очистить',
	'log.empty': 'Пока ничего не записано.',
	'log.noMatch': 'Ни одна запись не подходит под фильтр.',
	'log.jump': 'К последней записи',

	'settings.title': 'Настройки',
	'settings.subtitle': 'Изменения сохраняются сразу.',
	'settings.invalid': 'Недопустимое значение.',

	'settings.appearance': 'Внешний вид',
	'settings.appearance.description': 'Как приложение выглядит на этом компьютере.',
	'settings.mode': 'Режим',
	'settings.mode.description': 'Следовать Windows или выбрать фиксированный режим.',
	'settings.mode.light': 'Светлый',
	'settings.mode.dark': 'Тёмный',
	'settings.mode.system': 'Системный',
	'settings.colour': 'Цвет',
	'settings.colour.description': 'Меняется только акцент. Красный остаётся за удалением.',
	'settings.language': 'Язык',
	'settings.language.description': 'Следовать Windows или выбрать фиксированный язык.',
	'settings.language.system': 'Системный',

	'settings.navigation': 'Навигация',
	'settings.navigation.description':
		'Что предлагает боковая панель. Скрытие платформы не выполняет выход из неё.',
	'settings.showX': 'Показывать X',
	'settings.showX.description': 'Посты, ответы, репосты, лайки, подписки.',
	'settings.showYouTube': 'Показывать YouTube',
	'settings.showYouTube.description': 'Комментарии и понравившиеся видео.',
	'settings.showIntro': 'Показывать сведения',
	'settings.showIntro.description': 'Панель на обзоре, объясняющая, как работает приложение.',
	'settings.showLog': 'Показывать журнал',
	'settings.showLog.description': 'Живой журнал каждого действия, отдельной страницей.',
	'settings.showAssistant': 'Показывать ассистента',
	'settings.showAssistant.description': 'Страница, отвечающая на вопросы о приложении и о журнале.',

	'settings.safety': 'Безопасность',
	'settings.safety.description':
		'Удаление необратимо. Здесь решается, насколько настойчиво вас переспрашивают.',
	'settings.confirm': 'Подтверждать перед удалением',
	'settings.confirm.description': 'Спрашивать один раз за запуск.',

	'settings.timing': 'Тайминги',
	'settings.timing.description':
		'Повышать эти значения всегда безопасно. Снижение ускоряет удаление, но повышает риск, что его сочтут автоматизацией.',
	'settings.timing.afterLoad': 'После загрузки страницы',
	'settings.timing.afterLoad.description':
		'Сколько дать странице устояться перед первым удалением.',
	'settings.timing.betweenDeletes': 'Между удалениями',
	'settings.timing.betweenDeletes.description':
		'Пауза после каждого удалённого элемента. Главный тормоз против обнаружения автоматизации.',
	'settings.timing.betweenRetries': 'Между попытками',
	'settings.timing.betweenRetries.description':
		'Пауза перед повторной попыткой с элементом, который не исчез.',

	'settings.assistant': 'Ассистент',
	'settings.assistant.description':
		'Откуда берутся ответы. Локальная программа ничего не отправляет из этого приложения; облачный провайдер — единственное здесь, что выпускает данные в сеть.',
	'settings.assistant.source': 'Источник',
	'settings.assistant.off': 'Выключен',
	'settings.assistant.off.description': 'Ассистент выключен и не отображается в боковой панели.',
	'settings.assistant.local': 'Claude Code на этом компьютере',
	'settings.assistant.hosted': 'Облачный провайдер',
	'settings.assistant.cliPath': 'Путь к программе',
	'settings.assistant.cliPath.description':
		'Оставьте пустым, чтобы искать там, куда Claude Code ставит себя сам.',
	'settings.assistant.cliPath.placeholder': 'claude.exe',
	'settings.assistant.cliFound': 'Найдено: {version}',
	'settings.assistant.cliMissing': 'На этом компьютере не найдено.',
	'settings.assistant.provider': 'Провайдер',
	'settings.assistant.provider.description': 'Какая облачная модель отвечает и её ключ API.',
	'settings.assistant.keys': 'Ключи API',
	'settings.assistant.keys.title': 'Ключи API',
	'settings.assistant.keys.description':
		'Ключи попадают в диспетчер учётных данных Windows, а не в файл этого приложения. Ключ нельзя прочитать обратно — только заменить или забыть.',
	'settings.assistant.keys.placeholder': 'Вставьте ключ, чтобы сохранить его',
	'settings.assistant.keys.stored': 'Сохранён',
	'settings.assistant.keys.saved': 'Применён',
	'settings.assistant.keys.none': 'Ключа нет',
	'settings.assistant.keys.free': 'Получить бесплатный ключ',
	'settings.assistant.keys.forget': 'Забыть',
	'settings.assistant.keys.close': 'Готово',

	'assistant.title': 'Ассистент',
	'assistant.subtitle': 'Вопросы о том, что делает приложение, и о том, что написано в журнале.',
	'assistant.placeholder.patch': 'У меня пункт меню называется «Удалить из понравившихся видео»',
	'assistant.placeholder.report':
		'Удаление лайков остановилось после трёх видео, и меню закрылось само',
	'assistant.placeholder': 'Почему 12 постов не удалились?',
	'assistant.ask': 'Спросить',
	'assistant.asking': 'Спрашиваю…',
	'assistant.noSource':
		'Источник ещё не настроен. Выберите его в настройках — Claude Code на этом компьютере или ключ провайдера.',
	'assistant.openSettings': 'Открыть настройки',
	'assistant.sendsLog':
		'Вопрос отправляется вместе с журналом и описанием приложения. В журнале никогда нет содержимого постов, имён аккаунтов и cookie.',
	'assistant.clear': 'Очистить',
	'assistant.troubleshooting': 'Устранение неполадок',
	'assistant.troubleshooting.hint':
		'У большинства сбоев известна и причина, и способ починки. В руководстве они перечислены — и этот ассистент получает тот же список вместе с вашим журналом.',
	'assistant.preview.show': 'Показать, что отправится',
	'assistant.preview.hide': 'Скрыть, что отправится',
	'assistant.preview.description':
		'Запрос ровно в том виде, в каком он уйдёт с этого компьютера. Больше ничего не добавляется.',
	'assistant.preview.role': 'Указания',
	'assistant.preview.app': 'О приложении',
	'assistant.preview.fixes': 'Известные сбои и решения',
	'assistant.preview.log': 'Журнал',
	'assistant.preview.question': 'Ваш вопрос',
	'assistant.preview.noQuestion': 'Введите вопрос выше, чтобы увидеть его здесь.',

	'settings.about': 'О приложении',
	'settings.about.description':
		'Не связано с X Corp. и Google LLC, не одобрено и не спонсируется ими. X и YouTube — товарные знаки соответствующих владельцев.',
	'settings.version': 'Версия {version}',
	'settings.versionLoading': 'Загрузка версии…',
	'settings.checkUpdates': 'Проверить обновления',
	'settings.noUpdates': 'Обновлений нет.',
	'settings.github': 'Проект на GitHub',
	'settings.reportBug': 'Сообщить об ошибке',
	'settings.licenses': 'Лицензии третьих сторон',

	'info.title': 'Сведения',
	'info.subtitle': 'Что это за приложение, откуда оно и на чём построено.',
	'info.app.title': 'CleanMyPosts',
	'info.app.body':
		'Приложение для Windows, которое вычищает то, что вы опубликовали, лайкнули и на что подписались, платформа за платформой. Оно действует так же, как действовали бы вы: открывает страницу в окне браузера и кликает по ней, пока удалять станет нечего.',
	'info.developer': 'Разработчик',
	'info.version.title': 'Эта установка',
	'info.version.description': 'Обновления приложение скачивает и ставит само.',
	'info.links.title': 'Ссылки',
	'info.links.description': 'Всё открыто: код, ошибки и то, на чём оно держится.',
	'info.github.description': 'Исходники, релизы и их история.',
	'info.reportBug.description': 'Что-то не удалилось или удалилось дважды? Вам сюда.',
	'info.licenses.description': 'Библиотеки с открытым кодом, входящие в приложение, и их условия.',
	'info.legal.title': 'Правовая информация',
	'info.troubleshooting.description':
		'Сбои, которые случаются снова и снова, и что делать с каждым.',

	'settings.general': 'Общие',
	'settings.general.description':
		'Какие страницы предлагает приложение. Скрытие платформы не выполняет выход из неё.',
	'settings.notifications': 'Уведомления',
	'settings.notifications.description':
		'Короткое сообщение в конце запуска. Через секунду исчезает само.',
	'settings.telemetry': 'Диагностические данные',
	'settings.telemetry.description':
		'Это приложение не отправляет телеметрию никуда. Переключатель управляет локальным журналом — единственной записью, которую оно ведёт.',
	'settings.autoConsent': 'Закрывать баннеры о cookie',
	'settings.autoConsent.description':
		'Закрывать баннеры согласия автоматически, выбирая кнопку отказа там, где она есть.',
	'settings.debugLogging': 'Подробный журнал',
	'settings.debugLogging.description':
		'Записывает, что на самом деле предлагала страница платформы, когда удаление не нашло пути. Полезно для отчёта об ошибке, в остальном — шум.',
	'settings.persistSession': 'Оставаться в системе',
	'settings.persistSession.description':
		'Сохранять кэш и cookie WebView2 между запусками. Если выключено, они удаляются при каждом старте, и X с YouTube открываются без входа.',
	'settings.automation': 'Автоматизация',
	'settings.automation.description': 'Как ведёт себя запуск и по чему он кликает.',
	'settings.engine': 'Движок удаления',
	'settings.engine.none': 'Встроенное поведение',
	'settings.engine.active': 'Ваш скрипт, строк: {count}',
	'settings.engine.edit': 'Изменить',
	'settings.engine.reset': 'Сбросить',
	'settings.engine.save': 'Сохранить',
	'settings.engine.hint':
		'Выполняется на странице платформы перед каждым действием. В `window.__cmp.config` лежат все селекторы и все слова, которые ищет движок, — поменяйте то, что нужно вашему языку или региону. Сломанный скрипт ничего не стоит: он перехватывается, попадает в журнал, и встроенное поведение продолжает работать.',
	'settings.engine.placeholder': "window.__cmp.config.youtube.removeFromLikedText.push('…');",

	'assistant.report': 'Сообщить о проблеме',
	'assistant.report.hint':
		'Ассистент превращает журнал в отчёт об ошибке. Вы его читаете, затем открывается GitHub с заполненной формой — отправка остаётся вашим кликом, ведь issue публичен.',
	'assistant.report.open': 'Сообщить на GitHub',
	'assistant.preview.report': 'Отчёт об ошибке',
	'assistant.mode': 'О чём этот запрос',
	'assistant.mode.question': 'Вопрос',
	'assistant.patch': 'AI Repair (экспериментально)',
	'assistant.patch.hint':
		'Если запуск ничего не удаляет, формулировки на странице обычно отличаются от ожидаемых приложением. Опишите, что видите - пункт меню, кнопку - и ассистент напишет небольшой скрипт. После сохранения он выполняется на странице платформы перед каждым удалением, поэтому сначала прочитайте его.',
	'assistant.patch.apply': 'Сохранить исправление',
	'assistant.patch.applied': 'Сохранено. Следующий запуск использует его.',
	'assistant.openInCli': 'Продолжить в Claude Code',
	'assistant.dismiss': 'Скрыть',

	'header.url': 'Вы здесь',

	'log.column.time': 'Время',
	'log.column.level': 'Уровень',
	'log.column.message': 'Сообщение',
	'log.sortBy': 'Сортировать по столбцу «{column}»',

	'assistant.preview.source': 'Где лежит код',
	'assistant.preview.patch': 'Задание на патч'
};
