import type { MessageKey } from './en';

/** Typed against `MessageKey`, so a key added in English fails to compile until it lands here. */
export const ja: Record<MessageKey, string> = {
	'app.tagline': '投稿・いいね・コメントを削除',

	'nav.overview': '概要',
	'nav.log': 'ログ',
	'nav.assistant': 'アシスタント',
	'nav.settings': '設定',
	'nav.info': '情報',
	'nav.collapse': 'メニューを折りたたむ',
	'nav.expand': 'メニューを広げる',

	'header.toDark': 'ダークモードに切り替える',
	'header.toLight': 'ライトモードに切り替える',
	'header.language': '言語',

	'site.signedIn': 'ログイン済み',
	'site.signedOut': '未ログイン',
	'site.signInHint':
		'このパネルの隣のブラウザーで {platform} にログインすると、削除できるようになります。',

	'action.show': '{label}を表示',
	'action.delete': '{label}をすべて削除',
	'action.deleteAll': 'すべて削除',
	'confirm.all.title': '{platform} のすべてを削除しますか？',
	'confirm.all.description': '{platform} で順に空にします: {lists}。取り消せません。',
	'run.allDone': '合計 {count} 件を削除しました。',
	'run.allPartly': '{count} 件を削除、{failed} 件のリストが失敗しました。',
	'action.close': '{platform} の操作を閉じる',

	'group.posts': 'ポスト',
	'group.replies': '返信',
	'group.reposts': 'リポスト',
	'group.likes': 'いいね',
	'group.following': 'フォロー中',
	'group.comments': 'コメント',
	'plural.posts': 'ポスト',
	'plural.replies': '返信',
	'plural.reposts': 'リポスト',
	'plural.likes': 'いいね',
	'plural.following': 'フォロー中のアカウント',
	'plural.comments': 'コメント',
	'plural.likedVideos': '高く評価した動画',

	'confirm.title': '{plural}をすべて削除しますか？',
	'confirm.description': '{platform} 上のあなたの{plural}をすべて削除します。取り消せません。',
	'confirm.confirm': '削除',
	'confirm.cancel': 'キャンセル',

	'run.deleting': '{label}を削除中',
	'run.removedSoFar': 'これまでに {count} 件削除',
	'run.stop': '停止',
	'run.none': '{plural}は削除されませんでした — 削除するものが見つかりませんでした。',
	'run.done': '{plural}を {count} 件整理しました。',
	'run.failed': '削除に失敗しました。',

	'overview.title': '概要',
	'overview.subtitle': '何が接続され、何を整理でき、何が動いているか。',
	'overview.how.title': '仕組み',
	'overview.how.lead':
		'CleanMyPosts は実際のブラウザーセッションを操作して、あなた自身のポスト・いいね・コメントを削除します。あなたが自分でするのと同じクリックを、止まらずに続けるだけです。',
	'overview.how.automation.title': 'API ではなく、ブラウザーの自動操作です。',
	'overview.how.automation.body':
		'プラットフォームのページはこのアプリ内のブラウザーウィンドウで開かれ、代わりにクリックされます。開発者アカウントも OAuth も API キーも不要 — プラットフォームが人間とは違う扱いで取り消したり制限したりできるものは、何もありません。',
	'overview.how.free.title': '無料で、これからも無料です。',
	'overview.how.free.body':
		'アカウントもサブスクリプションも有料プランもありません。削除ごとの課金がないのは、そもそも課金が一切ないからです。',
	'overview.how.private.title': 'あなたの PC から何も出ていきません。',
	'overview.how.private.body':
		'ログイン情報は Windows がこのアプリ用に既に保持しているブラウザープロファイルの中にあり、ブラウザーと同じ扱いです。あなたのポストがアップロードされたり、コピーされたり、保存されたりすることはありません。書き込まれるファイルはこのアプリの設定だけです。削除はわざとゆっくりで、間隔はあなたが決めます。それがボットに見えないための要です。',
	'overview.how.dismiss': '了解 — 今後は表示しない',
	'overview.kinds': '{count} 種類のコンテンツを削除できます。',
	'overview.open': '{platform} を開く',
	'overview.now.title': '現在',
	'overview.now.running': '{label}を削除中 — これまでに {count} 件削除。',
	'overview.now.idle': '実行中の処理はありません。',
	'overview.now.confirmOn': '削除前の確認はオンです。',
	'overview.now.confirmOff': '削除前の確認はオフです。',
	'overview.now.pause': '削除の間隔: {count} ms。',

	'log.title': 'ログ',
	'log.errors': 'エラー {count} 件',
	'log.warnings': '警告 {count} 件',
	'log.filter': '絞り込み…',
	'log.filterLabel': 'ログメッセージを絞り込む',
	'log.levelLabel': 'レベルで絞り込む',
	'log.level.all': 'すべて',
	'log.level.debug': 'デバッグ',
	'log.level.info': '情報',
	'log.level.warning': '警告',
	'log.level.error': 'エラー',
	'log.clear': 'クリア',
	'log.empty': 'まだ記録はありません。',
	'log.noMatch': '条件に合う項目はありません。',
	'log.jump': '最新へ移動',

	'settings.title': '設定',
	'settings.subtitle': '変更はその場で保存されます。',
	'settings.invalid': '設定値が不正です。',

	'settings.appearance': '外観',
	'settings.appearance.description': 'この PC でのアプリの見た目。',
	'settings.mode': 'モード',
	'settings.mode.description': 'Windows に合わせるか、固定するか。',
	'settings.mode.light': 'ライト',
	'settings.mode.dark': 'ダーク',
	'settings.mode.system': 'システム',
	'settings.colour': 'カラー',
	'settings.colour.description': '変わるのはアクセントだけです。赤は削除のために取ってあります。',
	'settings.language': '言語',
	'settings.language.description': 'Windows に合わせるか、固定するか。',
	'settings.language.system': 'システム',

	'settings.navigation': 'ナビゲーション',
	'settings.navigation.description':
		'サイドバーに何を並べるか。プラットフォームを隠してもログアウトはされません。',
	'settings.showX': 'X を表示',
	'settings.showX.description': 'ポスト、返信、リポスト、いいね、フォロー中。',
	'settings.showYouTube': 'YouTube を表示',
	'settings.showYouTube.description': 'コメントと高く評価した動画。',
	'settings.showIntro': '情報を表示',
	'settings.showIntro.description': 'アプリの仕組みを説明する、概要ページのパネル。',
	'settings.showLog': 'ログを表示',
	'settings.showLog.description': 'すべての動作のライブログを、独立したページとして。',
	'settings.showAssistant': 'アシスタントを表示',
	'settings.showAssistant.description': 'アプリとログについての質問に答えるページ。',

	'settings.safety': '安全',
	'settings.safety.description': '削除は取り消せません。ここでは確認の強さを決めます。',
	'settings.confirm': '削除前に確認する',
	'settings.confirm.description': '実行ごとに 1 回たずねます。',

	'settings.timing': '待ち時間',
	'settings.timing.description':
		'値を大きくするのは常に安全です。小さくすると削除は速くなりますが、自動化と判定されやすくなります。',
	'settings.timing.afterLoad': 'ページの読み込み後',
	'settings.timing.afterLoad.description': '最初の削除までページを落ち着かせる時間。',
	'settings.timing.betweenDeletes': '削除と削除の間',
	'settings.timing.betweenDeletes.description':
		'1 件削除するごとの待ち時間。自動化検知に対する主なブレーキです。',
	'settings.timing.betweenRetries': '再試行の間',
	'settings.timing.betweenRetries.description': '消えなかった項目を再試行するまでの待ち時間。',

	'settings.assistant': 'アシスタント',
	'settings.assistant.description':
		'回答がどこから来るか。ローカルのプログラムはこのアプリから何も送信しません。ホスト型プロバイダーだけが、ここでデータをネットワークに出す唯一のものです。',
	'settings.assistant.source': 'ソース',
	'settings.assistant.off': 'オフ',
	'settings.assistant.off.description': 'アシスタントはオフで、サイドバーには表示されません。',
	'settings.assistant.local': 'この PC の Claude Code',
	'settings.assistant.hosted': 'ホスト型プロバイダー',
	'settings.assistant.cliPath': '実行ファイルのパス',
	'settings.assistant.cliPath.description':
		'空のままにすると、Claude Code が自身をインストールする場所を探します。',
	'settings.assistant.cliPath.placeholder': 'claude.exe',
	'settings.assistant.cliFound': '見つかりました: {version}',
	'settings.assistant.cliMissing': 'この PC では見つかりませんでした。',
	'settings.assistant.provider': 'プロバイダー',
	'settings.assistant.provider.description': 'どのホスト型モデルが答えるか、とその API キー。',
	'settings.assistant.keys': 'API キー',
	'settings.assistant.keys.title': 'API キー',
	'settings.assistant.keys.description':
		'キーは Windows の資格情報マネージャーに入り、このアプリが持つファイルには決して入りません。キーは読み出せません — 置き換えるか、忘れさせるかだけです。',
	'settings.assistant.keys.placeholder': 'キーを貼り付けて保存',
	'settings.assistant.keys.stored': '保存済み',
	'settings.assistant.keys.saved': '反映しました',
	'settings.assistant.keys.none': 'キーなし',
	'settings.assistant.keys.free': '無料のキーを取得',
	'settings.assistant.keys.forget': '忘れる',
	'settings.assistant.keys.close': '完了',

	'assistant.title': 'アシスタント',
	'assistant.subtitle': 'このアプリの動作と、ログの内容についての質問。',
	'assistant.placeholder.patch':
		'私のページではメニューが「高く評価した動画から削除」と表示されます',
	'assistant.placeholder.report': '高評価の削除が3本で止まり、メニューが勝手に閉じました',
	'assistant.placeholder': 'なぜ 12 件のポストが削除されなかったのですか？',
	'assistant.ask': '質問する',
	'assistant.asking': '問い合わせ中…',
	'assistant.noSource':
		'ソースがまだ設定されていません。設定で選んでください — この PC の Claude Code か、プロバイダーのキーです。',
	'assistant.openSettings': '設定を開く',
	'assistant.sendsLog':
		'質問はログとアプリの説明と一緒に送信されます。ログにポストの内容、アカウント名、Cookie が入ることはありません。',
	'assistant.clear': 'クリア',
	'assistant.troubleshooting': 'トラブルシューティング',
	'assistant.troubleshooting.hint':
		'失敗のほとんどには既知の原因と既知の対処があります。ガイドがそれを並べており、このアシスタントにも同じ一覧がログとともに渡されます。',
	'assistant.preview.show': '送信される内容を表示',
	'assistant.preview.hide': '送信される内容を隠す',
	'assistant.preview.description':
		'この PC を出ていくとおりのリクエストです。これ以外は何も付け足されません。',
	'assistant.preview.role': '指示',
	'assistant.preview.app': 'アプリについて',
	'assistant.preview.fixes': '既知の失敗と対処',
	'assistant.preview.log': 'ログ',
	'assistant.preview.question': 'あなたの質問',
	'assistant.preview.noQuestion': '上に質問を入力すると、ここに表示されます。',

	'settings.about': 'このアプリについて',
	'settings.about.description':
		'X Corp. および Google LLC とは提携しておらず、承認や後援も受けていません。X と YouTube はそれぞれの所有者の商標です。',
	'settings.version': 'バージョン {version}',
	'settings.versionLoading': 'バージョンを読み込み中…',
	'settings.checkUpdates': '更新を確認',
	'settings.noUpdates': '利用できる更新はありません。',
	'settings.github': 'GitHub のプロジェクト',
	'settings.reportBug': '不具合を報告',
	'settings.licenses': 'サードパーティーライセンス',

	'info.title': '情報',
	'info.subtitle': 'このアプリが何で、どこから来て、何の上に建っているか。',
	'info.app.title': 'CleanMyPosts',
	'info.app.body':
		'あなたが投稿し、いいねし、フォローしたものを、プラットフォームごとに片づける Windows アプリです。やり方はあなた自身と同じで、ページをブラウザーウィンドウで開き、消すものがなくなるまでクリックし続けます。',
	'info.developer': '開発者',
	'info.version.title': 'このインストール',
	'info.version.description': '更新の取得とインストールはアプリ自身が行います。',
	'info.links.title': 'リンク',
	'info.links.description': 'すべて公開されています。コードも、不具合も、土台も。',
	'info.github.description': 'ソース、リリース、そしてその背景にある履歴。',
	'info.reportBug.description': '消えなかった、あるいは二重に消えた？ 報告はこちらへ。',
	'info.licenses.description': 'このアプリが同梱するオープンソースライブラリとその条項。',
	'info.legal.title': '法的事項',
	'info.troubleshooting.description': '繰り返し起きる不具合と、それぞれの対処。',

	'settings.general': '全般',
	'settings.general.description':
		'アプリが用意するページ。プラットフォームを隠してもログアウトはされません。',
	'settings.notifications': '通知',
	'settings.notifications.description':
		'実行が終わったときの短いメッセージ。1 秒で自然に消えます。',
	'settings.telemetry': '診断データ',
	'settings.telemetry.description':
		'このアプリはテレメトリをどこにも送りません。このスイッチが決めるのはローカルのログ、唯一残る記録です。',
	'settings.autoConsent': 'Cookie バナーを閉じる',
	'settings.autoConsent.description':
		'同意バナーを自動で閉じます。拒否のボタンがあるバナーでは、そちらを押します。',
	'settings.debugLogging': '詳細ログ',
	'settings.debugLogging.description':
		'削除が進まなかったとき、プラットフォームのページが実際に何を示していたかを記録します。不具合報告には有用、それ以外では雑音です。',
	'settings.persistSession': 'ログイン状態を保つ',
	'settings.persistSession.description':
		'WebView2 のキャッシュと Cookie を再起動後も残します。オフにすると起動ごとに破棄されるため、X と YouTube はログアウト状態で開きます。',
	'settings.automation': '自動化',
	'settings.automation.description': '実行のふるまいと、何をクリックするか。',
	'settings.engine': '削除エンジン',
	'settings.engine.none': '組み込みの動作',
	'settings.engine.active': '自分のスクリプト、{count} 行',
	'settings.engine.edit': '編集',
	'settings.engine.reset': 'リセット',
	'settings.engine.save': '保存',
	'settings.engine.hint':
		'各アクションの前に、プラットフォームのページで実行されます。`window.__cmp.config` にはエンジンが探すセレクターと語句がすべて入っています。言語や地域に合わせて書き換えてください。壊れたスクリプトの代償はありません。捕捉してログに残し、組み込みの動作がそのまま続きます。',
	'settings.engine.placeholder': "window.__cmp.config.youtube.removeFromLikedText.push('…');",

	'assistant.report': '不具合を報告',
	'assistant.report.hint':
		'アシスタントがログから不具合報告を作ります。内容を読んだあと、入力済みのフォームが GitHub で開きます。公開されるものなので、送信はあなたのクリックのままです。',
	'assistant.report.open': 'GitHub で報告',
	'assistant.preview.report': '不具合報告',
	'assistant.mode': 'この依頼の種類',
	'assistant.mode.question': '質問',
	'assistant.patch': 'AI Repair（実験的）',
	'assistant.patch.hint':
		'実行しても何も削除されないときは、ページの文言がアプリの想定と違うのが大半です。見えているもの - メニュー項目やボタン - を書けば、アシスタントが小さなスクリプトを作ります。保存すると削除のたびにプラットフォームのページ内で実行されるので、先に目を通してください。',
	'assistant.patch.apply': 'この修正を保存',
	'assistant.patch.applied': '保存しました。次の実行から使われます。',
	'assistant.openInCli': 'Claude Code で続ける',
	'assistant.dismiss': '閉じる',

	'header.url': '現在の場所',

	'log.column.time': '時刻',
	'log.column.level': 'レベル',
	'log.column.message': 'メッセージ',
	'log.sortBy': '{column}で並べ替え',

	'assistant.preview.source': 'コードの在りか',
	'assistant.preview.patch': 'パッチの指示'
};
