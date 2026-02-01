// Remove all liked videos from YouTube Liked Videos playlist
// URL: https://www.youtube.com/playlist?list=LL
// Usage: DeleteAllYouTubeLikes(1000, 500);
// Parameters:
//   waitAfterDelete: milliseconds to wait after each unlike (default: 1000)
//   waitBetweenDeleteAttempts: milliseconds to wait between retry attempts (default: 500)

async function DeleteAllYouTubeLikes(waitAfterDelete = 1000, waitBetweenDeleteAttempts = 500) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function log(msg) {
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
    }

    // Multilingual patterns for "Remove from Liked videos"
    const removePatterns = [
        // English
        'remove from liked',
        'remove from "liked',
        // German
        'aus "videos, die ich mag" entfernen',
        'videos, die ich mag',
        'entfernen',
        // French
        'supprimer de',
        "j'aime",
        'retirer de',
        // Spanish
        'eliminar de',
        'me gusta',
        'quitar de',
        // Italian
        'rimuovi da',
        'mi piace',
        // Portuguese
        'remover de',
        'gostei',
        // Dutch
        'verwijderen uit',
        // Polish
        'usuń z',
        // Russian (transliterated)
        'удалить из'
    ];

    function matchesRemovePattern(text) {
        const lowerText = text.toLowerCase();
        return removePatterns.some(pattern => lowerText.includes(pattern));
    }

    function findVideoItem() {
        // Try regular playlist video renderer first
        let videoItem = document.querySelector('ytd-playlist-video-renderer:not([is-dismissed])');
        if (videoItem) {
            return { element: videoItem, type: 'playlist' };
        }
        
        // Try rich item renderer (for shorts or single video view)
        videoItem = document.querySelector('ytd-rich-item-renderer:not([is-dismissed])');
        if (videoItem) {
            return { element: videoItem, type: 'rich' };
        }
        
        // Try compact video renderer
        videoItem = document.querySelector('ytd-compact-video-renderer:not([is-dismissed])');
        if (videoItem) {
            return { element: videoItem, type: 'compact' };
        }
        
        return null;
    }

    async function waitForVideo(maxWait = 5000, interval = 300) {
        const start = Date.now();
        while (true) {
            const result = findVideoItem();
            if (result) {
                log(`[waitForVideo] Found video item (type: ${result.type}).`);
                return true;
            }

            const elapsed = Date.now() - start;
            if (elapsed > maxWait) {
                log(`[waitForVideo] Timeout after ${elapsed}ms.`);
                return false;
            }

            window.scrollBy(0, 400);
            await delay(interval);
        }
    }

    async function clickMenuButton(videoItem, itemType) {
        let menuButton = null;
        
        if (itemType === 'playlist') {
            // Regular playlist: ytd-menu-renderer > yt-icon-button#button button
            const menuRenderer = videoItem.querySelector('ytd-menu-renderer');
            if (menuRenderer) {
                menuButton = menuRenderer.querySelector('yt-icon-button#button button') || 
                            menuRenderer.querySelector('button#button') ||
                            menuRenderer.querySelector('button');
            }
        } else if (itemType === 'rich' || itemType === 'compact') {
            // Shorts/Rich items: button with aria-label containing "action" or "Aktion" etc
            menuButton = videoItem.querySelector('button[aria-label*="ction"]') ||  // Action/Aktion
                        videoItem.querySelector('button[aria-label*="menu"]') ||
                        videoItem.querySelector('button[aria-label*="Menu"]') ||
                        videoItem.querySelector('button[aria-label*="Mehr"]') ||    // German "Mehr Aktionen"
                        videoItem.querySelector('button[aria-label*="More"]') ||    // English "More actions"
                        videoItem.querySelector('button[aria-label*="plus"]') ||    // French
                        videoItem.querySelector('button[aria-label*="más"]') ||     // Spanish
                        videoItem.querySelector('.shortsLockupViewModelHostOutsideMetadataMenu button') ||
                        videoItem.querySelector('ytd-menu-renderer button');
        }
        
        if (!menuButton) {
            // Fallback: try any three-dots menu button
            menuButton = videoItem.querySelector('button[aria-label]');
            if (menuButton) {
                const label = menuButton.getAttribute('aria-label') || '';
                log(`[clickMenuButton] Found button with aria-label: "${label}"`);
            }
        }
        
        if (!menuButton) {
            log("[clickMenuButton] Menu button not found.");
            return false;
        }

        menuButton.click();
        log("[clickMenuButton] Clicked menu button (...).");
        await delay(waitBetweenDeleteAttempts);
        return true;
    }

    async function clickRemoveFromLiked() {
        const delays = [200, 300, 400, 500, 600, 800, 1000, 1500];

        for (let i = 0; i < delays.length; i++) {
            await delay(delays[i]);
            
            let foundPopup = false;

            // Try Format 1: Shorts/contextual sheet popup (yt-list-view-model) - CHECK FIRST
            const sheetContainer = document.querySelector('.ytContextualSheetLayoutContentContainer');
            const listViewModel = document.querySelector('yt-list-view-model');
            const shortsPopup = sheetContainer || listViewModel;
            
            if (shortsPopup) {
                foundPopup = true;
                const listItems = shortsPopup.querySelectorAll('yt-list-item-view-model');
                log(`[clickRemoveFromLiked] Shorts popup: Found ${listItems.length} list items`);

                for (const listItem of listItems) {
                    // Get text from various possible title elements
                    const titleElement = listItem.querySelector('.yt-list-item-view-model__title') ||
                                        listItem.querySelector('.yt-core-attributed-string') ||
                                        listItem.querySelector('[role="text"]');
                    
                    const text = titleElement ? (titleElement.textContent || '') : (listItem.textContent || '');
                    log(`[clickRemoveFromLiked] Item: "${text.trim().substring(0, 50)}"`);

                    if (matchesRemovePattern(text)) {
                        // Click the container div or the list item itself
                        const clickTarget = listItem.querySelector('.yt-list-item-view-model__container') || 
                                           listItem.querySelector('div') ||
                                           listItem;
                        clickTarget.click();
                        log(`[clickRemoveFromLiked] SUCCESS - Clicked Shorts item: "${text.trim().substring(0, 40)}"`);
                        return true;
                    }
                }
            }

            // Try Format 2: Regular playlist popup (ytd-menu-popup-renderer)
            const popup = document.querySelector('ytd-menu-popup-renderer');
            if (popup) {
                foundPopup = true;
                const menuItems = popup.querySelectorAll('ytd-menu-service-item-renderer');
                log(`[clickRemoveFromLiked] Playlist popup: Found ${menuItems.length} menu items`);

                for (const menuItem of menuItems) {
                    const formattedString = menuItem.querySelector('yt-formatted-string');
                    const text = formattedString ? (formattedString.textContent || '') : (menuItem.textContent || '');
                    log(`[clickRemoveFromLiked] Item: "${text.trim().substring(0, 50)}"`);

                    if (matchesRemovePattern(text)) {
                        const paperItem = menuItem.querySelector('tp-yt-paper-item');
                        const clickTarget = paperItem || menuItem;
                        clickTarget.click();
                        log(`[clickRemoveFromLiked] SUCCESS - Clicked playlist item: "${text.trim().substring(0, 40)}"`);
                        return true;
                    }
                }
            }

            // Try Format 3: Any popup with role="listbox" or role="menu"
            const anyPopup = document.querySelector('[role="listbox"], [role="menu"]');
            if (anyPopup && !foundPopup) {
                foundPopup = true;
                const allItems = anyPopup.querySelectorAll('[role="menuitem"], [role="option"]');
                log(`[clickRemoveFromLiked] Generic popup: Found ${allItems.length} items`);

                for (const item of allItems) {
                    const text = item.textContent || '';
                    log(`[clickRemoveFromLiked] Item: "${text.trim().substring(0, 50)}"`);
                    
                    if (matchesRemovePattern(text)) {
                        item.click();
                        log(`[clickRemoveFromLiked] SUCCESS - Clicked generic item`);
                        return true;
                    }
                }
            }

            if (!foundPopup) {
                log(`[clickRemoveFromLiked] No popup found (attempt #${i + 1})`);
            } else {
                log(`[clickRemoveFromLiked] Popup found but no remove option (attempt #${i + 1})`);
            }
        }

        log("[clickRemoveFromLiked] Remove option not found in any menu format.");
        return false;
    }

    async function closeMenu() {
        // Press Escape to close any open menu
        document.body.dispatchEvent(new KeyboardEvent('keydown', { 
            key: 'Escape', 
            code: 'Escape',
            keyCode: 27, 
            bubbles: true 
        }));
        await delay(200);
    }

    async function unlikeVideo() {
        log("[unlikeVideo] Searching for video to unlike...");

        // Find first non-dismissed video
        const result = findVideoItem();
        if (!result) {
            log("[unlikeVideo] No video item found.");
            return false;
        }
        
        const { element: videoItem, type: itemType } = result;
        log(`[unlikeVideo] Found ${itemType} video item.`);

        // Click the menu button
        if (!await clickMenuButton(videoItem, itemType)) {
            return false;
        }

        // Click "Remove from Liked videos"
        if (!await clickRemoveFromLiked()) {
            await closeMenu();
            return false;
        }

        await delay(500);

        // Wait for video to be dismissed (is-dismissed attribute added)
        const waitDelays = [200, 300, 500, 700, 1000, 1500];
        for (let i = 0; i < waitDelays.length; i++) {
            await delay(waitDelays[i]);
            // Check if dismissed attribute was added
            if (videoItem.hasAttribute('is-dismissed')) {
                log("[unlikeVideo] Video dismissed successfully.");
                return true;
            }
            // Also check if removed from DOM
            if (!document.contains(videoItem)) {
                log("[unlikeVideo] Video removed from DOM.");
                return true;
            }
            // Check if hidden
            if (videoItem.hasAttribute('hidden')) {
                log("[unlikeVideo] Video hidden successfully.");
                return true;
            }
        }

        log("[unlikeVideo] Video may have been dismissed.");
        return true;
    }

    window.youtubeLikesDeletionDone = false;
    window.deletedYouTubeLikes = 0;
    log("[DeleteAllYouTubeLikes] Starting unlike loop on YouTube Liked Videos...");
    log("[DeleteAllYouTubeLikes] Make sure you are on: https://www.youtube.com/playlist?list=LL");

    let failures = 0;
    const maxFailures = 3;
    let videoNumber = 1;

    while (failures < maxFailures) {
        const found = await waitForVideo(5000, 300);
        if (!found) {
            failures++;
            log(`[DeleteAllYouTubeLikes] No video found (failure #${failures}). Scrolling...`);

            const prevScroll = window.scrollY;
            window.scrollBy(0, 500);
            await delay(500);

            if (window.scrollY === prevScroll) {
                log("[DeleteAllYouTubeLikes] No scroll change. Assuming no more videos.");
                break;
            }

            continue;
        }

        log(`[DeleteAllYouTubeLikes] Unliking video #${videoNumber}...`);
        const success = await unlikeVideo();

        if (success) {
            window.deletedYouTubeLikes++;
            log(`[DeleteAllYouTubeLikes] Unliked video #${videoNumber}`);
            videoNumber++;
            failures = 0;
            await delay(waitAfterDelete);
        } else {
            failures++;
            log(`[DeleteAllYouTubeLikes] Failed to unlike video #${videoNumber} (failure #${failures})`);
            await closeMenu();
            await delay(500);
        }
    }

    log(`[DeleteAllYouTubeLikes] Unlike finished. Total unliked: ${window.deletedYouTubeLikes}`);
    
    // Reload page to refresh the list
    if (window.deletedYouTubeLikes > 0) {
        log("[DeleteAllYouTubeLikes] Reloading page...");
        await delay(500);
        window.location.reload();
    }
    
    window.youtubeLikesDeletionDone = true;
}
