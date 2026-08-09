import type { MessageKey } from './en';

/** Typed against `MessageKey`, so a key added in English fails to compile until it lands here. */
export const hi: Record<MessageKey, string> = {
	'app.tagline': 'पोस्ट, लाइक और टिप्पणियाँ हटाता है',

	'nav.overview': 'अवलोकन',
	'nav.log': 'लॉग',
	'nav.assistant': 'सहायक',
	'nav.settings': 'सेटिंग्स',
	'nav.info': 'जानकारी',
	'nav.collapse': 'मेन्यू छोटा करें',
	'nav.expand': 'मेन्यू बड़ा करें',

	'header.toDark': 'डार्क मोड पर जाएँ',
	'header.toLight': 'लाइट मोड पर जाएँ',
	'header.language': 'भाषा',

	'site.signedIn': 'साइन इन है',
	'site.signedOut': 'साइन इन नहीं है',
	'site.signInHint':
		'सफ़ाई शुरू करने के लिए इस पैनल के बगल वाले ब्राउज़र में {platform} पर साइन इन करें।',

	'action.show': '{label} दिखाएँ',
	'action.delete': 'सभी {label} हटाएँ',
	'action.deleteAll': 'सब कुछ हटाएँ',
	'confirm.all.title': '{platform} पर सब कुछ हटाएँ?',
	'confirm.all.description':
		'{platform} पर एक के बाद एक खाली किया जाएगा: {lists}. इसे पूर्ववत नहीं किया जा सकता।',
	'run.allDone': 'कुल {count} आइटम हटाए गए।',
	'run.allPartly': '{count} आइटम हटाए गए, {failed} सूचियाँ विफल रहीं।',
	'action.close': '{platform} की क्रियाएँ बंद करें',
	'action.open': '{platform} की क्रियाएँ खोलें',

	'assistant.controls': 'सहायक की सेटिंग',
	'assistant.close': 'सहायक बंद करें',
	'assistant.effort': 'प्रयास',
	'assistant.effort.low': 'संक्षिप्त',
	'assistant.effort.medium': 'सामान्य',
	'assistant.effort.high': 'विस्तृत',
	'assistant.model': 'मॉडल',
	'assistant.model.default': 'प्रदाता का डिफ़ॉल्ट',
	'assistant.panel.empty':
		'साथ वाले पृष्ठ के लिए योजना माँगें — क्या हटाना है और उनमें से एक कैसे जाता है।',
	'assistant.noSource.short': 'कोई स्रोत नहीं',

	'assistant.plan.save': 'क्रिया के रूप में रखें',
	'assistant.plan.name': 'इस क्रिया का नाम',
	'assistant.plan.keep': 'रखें',
	'assistant.plan.saved': 'सहेजा गया — {label} अब क्रियाओं में है',
	'panel.saved': 'सहेजी गई क्रियाएँ',
	'confirm.saved.description':
		'{label} चलाता है — एक योजना जो सहायक ने {platform} के लिए तब लिखी थी। इसे पूर्ववत नहीं किया जा सकता।',
	'assistant.plan.count': 'पहले जाँचें',
	'assistant.plan.run': 'एक बार चलाएँ',
	'assistant.plan.matches': 'इस पृष्ठ पर {count} मेल',
	'assistant.plan.removed': '{count} हटाए गए',
	'assistant.plan.rejected': 'यह योजना नहीं है — {reason}',
	'assistant.plan.noPlatform': 'यहाँ आज़माने के लिए किसी प्लेटफ़ॉर्म में साइन इन करें',
	'assistant.plan.label': 'सहायक की योजना',

	'group.posts': 'पोस्ट',
	'group.replies': 'जवाब',
	'group.reposts': 'रीपोस्ट',
	'group.likes': 'लाइक',
	'group.following': 'फ़ॉलोइंग',
	'group.comments': 'टिप्पणियाँ',
	'plural.posts': 'पोस्ट',
	'plural.replies': 'जवाब',
	'plural.reposts': 'रीपोस्ट',
	'plural.likes': 'लाइक',
	'plural.following': 'फ़ॉलो किए गए खाते',
	'plural.comments': 'टिप्पणियाँ',
	'plural.likedVideos': 'पसंद किए गए वीडियो',

	'confirm.title': 'सभी {plural} हटाएँ?',
	'confirm.description':
		'इससे {platform} पर आपके सभी {plural} हट जाएँगे। इसे पहले जैसा नहीं किया जा सकता।',
	'confirm.confirm': 'हटाएँ',
	'confirm.cancel': 'रद्द करें',

	'run.deleting': '{label} हटाए जा रहे हैं',
	'run.removedSoFar': 'अब तक {count} हटाए गए',
	'run.stop': 'रोकें',
	'run.none': 'कोई {plural} नहीं हटाए गए — हटाने के लिए कुछ मिला ही नहीं।',
	'run.done': '{count} {plural} साफ़ किए गए।',
	'run.failed': 'हटाना विफल रहा।',

	'overview.title': 'अवलोकन',
	'overview.subtitle': 'क्या जुड़ा है, क्या साफ़ किया जा सकता है, और क्या चल रहा है।',
	'overview.how.title': 'यह कैसे काम करता है',
	'overview.how.lead':
		'CleanMyPosts एक असली ब्राउज़र सत्र चलाकर आपकी अपनी पोस्ट, लाइक और टिप्पणियाँ हटाता है — वही क्लिक जो आप खुद करते, बस रुके बिना।',
	'overview.how.automation.title': 'ब्राउज़र ऑटोमेशन, कोई API नहीं।',
	'overview.how.automation.body':
		'प्लेटफ़ॉर्म का पेज इसी ऐप के भीतर एक ब्राउज़र विंडो में खुलता है और आपके लिए क्लिक किया जाता है। कोई डेवलपर खाता नहीं, कोई OAuth नहीं, कोई API कुंजी नहीं — ऐसा कुछ भी नहीं जिसे प्लेटफ़ॉर्म किसी व्यक्ति से अलग तरीके से रद्द या सीमित कर सके।',
	'overview.how.free.title': 'मुफ़्त है, और मुफ़्त ही रहेगा।',
	'overview.how.free.body':
		'न कोई खाता, न सदस्यता, न कोई भुगतान वाला स्तर। प्रति हटाने का शुल्क नहीं है, क्योंकि कोई शुल्क है ही नहीं।',
	'overview.how.private.title': 'कुछ भी आपकी मशीन से बाहर नहीं जाता।',
	'overview.how.private.body':
		'आपका लॉगिन उसी ब्राउज़र प्रोफ़ाइल में रहता है जिसे Windows पहले से इस ऐप के लिए रखता है, ठीक जैसे किसी ब्राउज़र में। आपकी पोस्ट कभी अपलोड, कॉपी या संग्रहीत नहीं होतीं — केवल इस ऐप की अपनी सेटिंग्स ही लिखी जाती हैं। हटाना जान-बूझकर धीमा है, और ठहराव आप तय करते हैं, क्योंकि यही उसे बॉट जैसा दिखने से रोकता है।',
	'overview.how.dismiss': 'समझ गया — दोबारा न दिखाएँ',
	'overview.kinds': '{count} तरह की सामग्री हटाई जा सकती है।',
	'overview.open': '{platform} खोलें',
	'overview.now.title': 'अभी',
	'overview.now.running': '{label} हटाए जा रहे हैं — अब तक {count} हटाए गए।',
	'overview.now.idle': 'कुछ नहीं चल रहा है।',
	'overview.now.confirmOn': 'हटाने से पहले पुष्टि चालू है।',
	'overview.now.confirmOff': 'हटाने से पहले पुष्टि बंद है।',
	'overview.now.pause': 'दो हटाने के बीच ठहराव: {count} मि.से.।',

	'log.title': 'लॉग',
	'log.errors': '{count} त्रुटियाँ',
	'log.warnings': '{count} चेतावनियाँ',
	'log.filter': 'छानें…',
	'log.filterLabel': 'लॉग संदेश छानें',
	'log.levelLabel': 'स्तर से छानें',
	'log.level.all': 'सभी',
	'log.level.debug': 'डिबग',
	'log.level.info': 'सूचना',
	'log.level.warning': 'चेतावनी',
	'log.level.error': 'त्रुटि',
	'log.clear': 'खाली करें',
	'log.empty': 'अभी तक कुछ दर्ज नहीं हुआ।',
	'log.noMatch': 'छन्नी से कोई प्रविष्टि मेल नहीं खाती।',
	'log.jump': 'नवीनतम पर जाएँ',

	'settings.title': 'सेटिंग्स',
	'settings.subtitle': 'बदलाव करते ही सहेज लिए जाते हैं।',
	'settings.invalid': 'अमान्य मान।',

	'settings.appearance': 'रूप-रंग',
	'settings.appearance.description': 'इस मशीन पर ऐप कैसा दिखता है।',
	'settings.mode': 'मोड',
	'settings.mode.description': 'Windows का अनुसरण करें या कोई मोड तय करें।',
	'settings.mode.light': 'लाइट',
	'settings.mode.dark': 'डार्क',
	'settings.mode.system': 'सिस्टम',
	'settings.colour': 'रंग',
	'settings.colour.description': 'सिर्फ़ ज़ोर का रंग बदलता है। लाल हटाने के लिए सुरक्षित है।',
	'settings.language': 'भाषा',
	'settings.language.description': 'Windows का अनुसरण करें या कोई भाषा तय करें।',
	'settings.language.system': 'सिस्टम',

	'settings.navigation': 'नेविगेशन',
	'settings.navigation.description':
		'साइडबार क्या दिखाता है। किसी प्लेटफ़ॉर्म को छिपाने से आप उससे साइन आउट नहीं होते।',
	'settings.showX': 'X दिखाएँ',
	'settings.showX.description': 'पोस्ट, जवाब, रीपोस्ट, लाइक, फ़ॉलोइंग।',
	'settings.showYouTube': 'YouTube दिखाएँ',
	'settings.showYouTube.description': 'टिप्पणियाँ और पसंद किए गए वीडियो।',
	'settings.showIntro': 'जानकारी दिखाएँ',
	'settings.showIntro.description': 'अवलोकन पर वह पैनल जो बताता है कि ऐप कैसे काम करता है।',
	'settings.showLog': 'लॉग दिखाएँ',
	'settings.showLog.description': 'हर क्रिया का लाइव लॉग, अपने अलग पेज पर।',
	'settings.showAssistant': 'सहायक दिखाएँ',
	'settings.showAssistant.description': 'एक पेज जो ऐप और लॉग के बारे में सवालों के जवाब देता है।',

	'settings.safety': 'सुरक्षा',
	'settings.safety.description':
		'हटाना पहले जैसा नहीं किया जा सकता। यहाँ तय होता है कि आपसे कितनी सख़्ती से पूछा जाए।',
	'settings.confirm': 'हटाने से पहले पुष्टि करें',
	'settings.confirm.description': 'हर दौर में एक बार पूछें।',

	'settings.timing': 'समय',
	'settings.timing.description':
		'इन्हें बढ़ाना हमेशा सुरक्षित है। घटाने से हटाना तेज़ होता है, पर ऑटोमेशन के रूप में पकड़े जाने की संभावना बढ़ती है।',
	'settings.timing.afterLoad': 'पेज लोड होने के बाद',
	'settings.timing.afterLoad.description': 'पहले हटाने से पहले पेज को कितनी देर जमने दें।',
	'settings.timing.betweenDeletes': 'दो हटाने के बीच',
	'settings.timing.betweenDeletes.description':
		'हर हटाई गई चीज़ के बाद ठहराव। ऑटोमेशन पहचान के ख़िलाफ़ मुख्य ब्रेक।',
	'settings.timing.betweenRetries': 'दो प्रयासों के बीच',
	'settings.timing.betweenRetries.description':
		'जो चीज़ ग़ायब नहीं हुई, उसे दोबारा आज़माने से पहले ठहराव।',

	'settings.assistant': 'सहायक',
	'settings.assistant.description':
		'जवाब कहाँ से आते हैं। स्थानीय प्रोग्राम इस ऐप से कुछ नहीं भेजता; होस्टेड प्रदाता ही यहाँ अकेली चीज़ है जो डेटा नेटवर्क पर भेजती है।',
	'settings.assistant.source': 'स्रोत',
	'settings.assistant.off': 'बंद',
	'settings.assistant.off.description': 'सहायक बंद है और साइडबार में नहीं दिखता।',
	'settings.assistant.local': 'इस मशीन पर Claude Code',
	'settings.assistant.hosted': 'एक होस्टेड प्रदाता',
	'settings.assistant.cliPath': 'प्रोग्राम का पथ',
	'settings.assistant.cliPath.description':
		'खाली छोड़ें ताकि वहाँ देखा जाए जहाँ Claude Code खुद को स्थापित करता है।',
	'settings.assistant.cliPath.placeholder': 'claude.exe',
	'settings.assistant.cliFound': 'मिला: {version}',
	'settings.assistant.cliMissing': 'इस मशीन पर नहीं मिला।',
	'settings.assistant.provider': 'प्रदाता',
	'settings.assistant.provider.description': 'कौन-सा होस्टेड मॉडल जवाब देता है, और उसकी API कुंजी।',
	'settings.assistant.keys': 'API कुंजियाँ',
	'settings.assistant.keys.title': 'API कुंजियाँ',
	'settings.assistant.keys.description':
		'कुंजियाँ Windows क्रेडेंशियल मैनेजर में जाती हैं, इस ऐप की किसी फ़ाइल में कभी नहीं। कुंजी दोबारा पढ़ी नहीं जा सकती — केवल बदली या भुलाई जा सकती है।',
	'settings.assistant.keys.placeholder': 'सहेजने के लिए कुंजी चिपकाएँ',
	'settings.assistant.keys.stored': 'सहेजी गई',
	'settings.assistant.keys.saved': 'लागू',
	'settings.assistant.keys.none': 'कोई कुंजी नहीं',
	'settings.assistant.keys.free': 'मुफ़्त कुंजी लें',
	'settings.assistant.keys.forget': 'भुला दें',
	'settings.assistant.keys.close': 'हो गया',

	'assistant.title': 'सहायक',
	'assistant.subtitle': 'यह ऐप क्या करता है और लॉग क्या कहता है, इस बारे में सवाल।',
	'assistant.placeholder.patch': 'मेरे पेज पर मेन्यू में «पसंद किए गए वीडियो से हटाएँ» लिखा है',
	'assistant.placeholder.report':
		'तीन वीडियो के बाद लाइक हटाना रुक गया और मेन्यू अपने आप बंद हो गया',
	'assistant.placeholder': '12 पोस्ट क्यों नहीं हटीं?',
	'assistant.ask': 'पूछें',
	'assistant.asking': 'पूछा जा रहा है…',
	'assistant.noSource':
		'अभी कोई स्रोत तय नहीं है। सेटिंग्स में एक चुनें — इस मशीन पर Claude Code, या किसी प्रदाता की कुंजी।',
	'assistant.openSettings': 'सेटिंग्स खोलें',
	'assistant.sendsLog':
		'सवाल लॉग और ऐप के विवरण के साथ भेजा जाता है। लॉग में कभी पोस्ट की सामग्री, खाता नाम या कुकी नहीं होतीं।',
	'assistant.clear': 'खाली करें',
	'assistant.troubleshooting': 'समस्या-निवारण',
	'assistant.troubleshooting.hint':
		'ज़्यादातर विफलताओं की वजह और उपाय दोनों पता हैं। गाइड उन्हें गिनाती है — और यही सूची इस सहायक को आपके लॉग के साथ दी जाती है।',
	'assistant.preview.show': 'देखें कि क्या भेजा जाएगा',
	'assistant.preview.hide': 'छिपाएँ कि क्या भेजा जाएगा',
	'assistant.preview.description':
		'अनुरोध बिलकुल वैसा, जैसा वह इस मशीन से जाएगा। इससे आगे कुछ नहीं जोड़ा जाता।',
	'assistant.preview.role': 'निर्देश',
	'assistant.preview.app': 'ऐप के बारे में',
	'assistant.preview.fixes': 'ज्ञात विफलताएँ और उपाय',
	'assistant.preview.log': 'लॉग',
	'assistant.preview.question': 'आपका सवाल',
	'assistant.preview.noQuestion': 'ऊपर सवाल लिखें, वह यहाँ दिखेगा।',

	'settings.about': 'परिचय',
	'settings.about.description':
		'X Corp. या Google LLC से संबद्ध, अनुमोदित या प्रायोजित नहीं। X और YouTube अपने-अपने स्वामियों के ट्रेडमार्क हैं।',
	'settings.versionBuilt': 'संस्करण {version}, {date} को बनाया गया',
	'settings.versionLoading': 'संस्करण लोड हो रहा है…',
	'settings.checkUpdates': 'अपडेट देखें',
	'settings.noUpdates': 'कोई अपडेट उपलब्ध नहीं।',
	'update.checking': 'खोजा जा रहा है…',
	'update.available.title': 'अपडेट उपलब्ध है',
	'update.available.body':
		'संस्करण {version} इंस्टॉल करने के लिए तैयार है। पूरा होने पर CleanMyPosts खुद बंद होकर दोबारा खुलेगा; जो कुछ चल रहा है वह रुक जाएगा।',
	'update.install': 'इंस्टॉल करें और पुनः आरंभ करें',
	'update.later': 'अभी नहीं',
	'update.downloading': 'अपडेट {version} डाउनलोड हो रहा है',
	'update.downloadingPercent': 'अपडेट {version} डाउनलोड हो रहा है — {percent}%',
	'update.failed': 'अपडेट इंस्टॉल नहीं हो सका: {message}',
	'update.checkFailed': 'अपडेट की जाँच नहीं हो सकी: {message}',
	'settings.github': 'GitHub पर परियोजना',
	'settings.reportBug': 'समस्या बताएँ',
	'settings.licenses': 'तृतीय-पक्ष लाइसेंस',

	'info.title': 'जानकारी',
	'info.subtitle': 'यह ऐप क्या है, कहाँ से आया है, और किस पर बना है।',
	'info.app.title': 'CleanMyPosts',
	'info.app.body':
		'एक Windows ऐप जो आपकी पोस्ट, लाइक और फ़ॉलो को एक-एक प्लेटफ़ॉर्म करके ख़ाली करता है। यह वैसे ही काम करता है जैसे आप करते: पेज को ब्राउज़र विंडो में खोलता है और तब तक क्लिक करता रहता है जब तक हटाने को कुछ बचे नहीं।',
	'info.developer': 'डेवलपर',
	'info.version.title': 'यह इंस्टॉलेशन',
	'info.version.description': 'अपडेट ऐप ख़ुद डाउनलोड और इंस्टॉल करता है।',
	'info.links.title': 'लिंक',
	'info.links.description': 'सब कुछ खुला है: कोड, समस्याएँ, और इसकी नींव।',
	'info.github.description': 'स्रोत, रिलीज़, और उनके पीछे का इतिहास।',
	'info.reportBug.description': 'कुछ हटा नहीं, या दो बार हट गया? बात यहाँ रखें।',
	'info.licenses.description': 'इस ऐप के साथ आने वाली ओपन-सोर्स लाइब्रेरियाँ और उनकी शर्तें।',
	'info.legal.title': 'क़ानूनी',
	'info.troubleshooting.description': 'जो गड़बड़ियाँ बार-बार आती हैं, और हर एक का उपाय।',

	'settings.general': 'सामान्य',
	'settings.general.description':
		'ऐप कौन-से पेज देता है। किसी प्लेटफ़ॉर्म को छिपाने से आप उससे साइन आउट नहीं होते।',
	'settings.notifications': 'सूचनाएँ',
	'settings.notifications.description':
		'दौर ख़त्म होने पर एक छोटा संदेश। एक सेकंड बाद अपने आप चला जाता है।',
	'settings.autoConsent': 'कुकी बैनर हटाएँ',
	'settings.autoConsent.description':
		'सहमति बैनर अपने आप बंद करें, और जहाँ बैनर मना करने वाला बटन देता है, वही दबाएँ।',
	'settings.actions': 'सहेजी गई क्रियाएँ',
	'settings.actions.description':
		'सहायक की लिखी योजनाएँ जो आपने रखीं। हर एक एक सेलेक्टर है, इसलिए प्लेटफ़ॉर्म बदलते ही काम करना बंद कर देती है।',
	'settings.actions.empty': 'अभी कुछ नहीं रखा गया। सहायक से योजना माँगें और वहीं से रखें।',
	'settings.actions.made': '{platform} · {date} को रखा',
	'settings.actions.moveUp': 'ऊपर ले जाएँ',
	'settings.actions.moveDown': 'नीचे ले जाएँ',
	'settings.actions.rename': 'नाम बदलें',
	'settings.actions.plan': 'योजना',
	'overview.saved': 'सहेजी गई क्रियाएँ',
	'overview.saved.description': 'आपकी रखी योजनाएँ। एक क्लिक उसे उसके प्लेटफ़ॉर्म पर चलाता है।',
	'settings.actions.forget': 'भूलें',
	'settings.actions.forgetAll': 'सब भूलें',
	'settings.actions.forgetAll.confirmBody':
		'इससे {count} सहेजी गई क्रियाएँ हट जाएँगी। इन्हें वापस नहीं लाया जा सकता — जिस उत्तर से वे आई थीं वह जा चुका है और पृष्ठ बदल चुका है।',

	'settings.reset.title': 'रीसेट',
	'settings.reset.description': 'सभी सेटिंग्स को नई स्थापना जैसी स्थिति में लौटाता है।',
	'settings.reset.action': 'डिफ़ॉल्ट पर रीसेट करें',
	'settings.reset.confirmBody':
		'थीम, भाषा और सहायक सहित सभी सेटिंग्स अपने डिफ़ॉल्ट पर लौट आती हैं। साइन-इन सत्र और लॉग अछूते रहते हैं।',
	'settings.reset.done': 'सेटिंग्स रीसेट हो गईं',
	'settings.debugLogging': 'विस्तृत लॉग',
	'settings.debugLogging.description':
		'जब कोई विलोपन रास्ता न पाए, तो यह दर्ज करता है कि प्लेटफ़ॉर्म पृष्ठ ने वास्तव में क्या दिखाया। बग रिपोर्ट के लिए उपयोगी, अन्यथा शोर।',
	'settings.persistSession': 'साइन इन बनाए रखें',
	'settings.persistSession.description':
		'WebView2 का कैश और कुकीज़ हर बार शुरू होने पर बनी रहती हैं। बंद होने पर हर शुरुआत में मिटा दी जाती हैं, इसलिए X और YouTube साइन आउट खुलते हैं।',
	'settings.checkUpdatesOnStart': 'शुरू होने पर अपडेट देखें',
	'settings.checkUpdatesOnStart.description':
		'हर बार ऐप शुरू होने पर रिलीज़ पेज से नया संस्करण पूछता है और मिलने पर अवलोकन में बताता है। बंद होने पर अपडेट तभी मिलेंगे जब आप जानकारी पेज का बटन दबाएँगे।',
	'settings.automation': 'ऑटोमेशन',
	'settings.automation.description': 'एक दौर कैसे चलता है, और वह किस पर क्लिक करता है।',
	'settings.engine': 'डिलीट इंजन',
	'settings.engine.none': 'अंतर्निहित व्यवहार',
	'settings.engine.active': 'आपकी अपनी स्क्रिप्ट, {count} पंक्तियाँ',
	'settings.engine.edit': 'बदलें',
	'settings.engine.reset': 'रीसेट',
	'settings.engine.save': 'सहेजें',
	'settings.engine.hint':
		'हर क्रिया से पहले प्लेटफ़ॉर्म पेज में चलती है। `window.__cmp.config` में वे सारे सिलेक्टर और शब्द हैं जिन्हें इंजन ढूँढ़ता है — जो आपकी भाषा या क्षेत्र को चाहिए, वह बदल दें। ख़राब स्क्रिप्ट का कोई नुक़सान नहीं: वह पकड़ी जाती है, लॉग होती है, और अंतर्निहित व्यवहार चलता रहता है।',
	'settings.engine.placeholder': "window.__cmp.config.youtube.removeFromLikedText.push('…');",

	'assistant.report': 'समस्या की रिपोर्ट करें',
	'assistant.report.hint':
		'सहायक लॉग को बग रिपोर्ट में बदलता है। आप उसे पढ़ते हैं, फिर भरा हुआ फ़ॉर्म GitHub पर खुलता है — भेजना आपका क्लिक रहता है, क्योंकि इशू सार्वजनिक होता है।',
	'assistant.report.open': 'GitHub पर रिपोर्ट करें',
	'assistant.preview.report': 'बग रिपोर्ट',
	'assistant.mode': 'यह अनुरोध किस बारे में है',
	'assistant.mode.question': 'प्रश्न',
	'assistant.patch': 'AI Repair (प्रयोगात्मक)',
	'assistant.patch.hint':
		'जब कोई रन कुछ नहीं हटाता, तो पृष्ठ के शब्द आमतौर पर ऐप की अपेक्षा से भिन्न होते हैं। जो दिखता है उसका वर्णन करें - मेनू आइटम, बटन - और सहायक एक छोटी स्क्रिप्ट लिखेगा। सहेजने पर वह हर विलोपन से पहले प्लेटफ़ॉर्म पृष्ठ में चलती है, इसलिए पहले उसे पढ़ें।',
	'assistant.patch.apply': 'सुधार सहेजें',
	'assistant.patch.applied': 'सहेज लिया। अगला दौर इसी से चलेगा।',
	'assistant.openInCli': 'Claude Code में जारी रखें',
	'assistant.dismiss': 'हटाएँ',

	'header.url': 'आप यहाँ हैं',

	'log.column.time': 'समय',
	'log.column.level': 'स्तर',
	'log.column.message': 'संदेश',
	'log.sortBy': '{column} से क्रम लगाएँ',

	'assistant.preview.source': 'कोड कहाँ है',
	'assistant.preview.structure': 'अभी का पृष्ठ',
	'assistant.preview.engine': 'इंजन यह कैसे करता है',
	'assistant.preview.patch': 'पैच का काम'
};
