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

    async function waitForVideo(maxWait = 5000, interval = 300) {
        const start = Date.now();
        while (true) {
            // Find video items in the liked videos playlist
            const videoItem = document.querySelector('ytd-playlist-video-renderer');
            if (videoItem) {
                log("[waitForVideo] Found video item.");
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

    async function clickMenuButton(videoItem) {
        // Find and click the ... menu button (three dots)
        const menuButton = videoItem.querySelector('ytd-menu-renderer button#button, ytd-menu-renderer yt-icon-button#button button, button[aria-label*="Action"], button[aria-label*="Aktion"]');
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
        const delays = [100, 200, 300, 500, 500, 500, 1000, 1000];

        for (let i = 0; i < delays.length; i++) {
            await delay(delays[i]);

            // Find the menu popup and look for "Remove from Liked videos" option
            const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer, tp-yt-paper-item, yt-formatted-string');
            for (const item of menuItems) {
                const text = item.textContent.toLowerCase();
                // Match various languages:
                // EN: "Remove from Liked videos"
                // DE: "Aus \"Videos, die ich mag\" entfernen"
                // FR: "Supprimer de \"J'aime\""
                // ES: "Eliminar de \"Me gusta\""
                if (text.includes('remove from') || 
                    text.includes('entfernen') || 
                    text.includes('aus "videos, die ich mag"') ||
                    text.includes('videos, die ich mag') ||
                    text.includes('liked videos') ||
                    text.includes('supprimer de') ||
                    text.includes("j'aime") ||
                    text.includes('eliminar de') ||
                    text.includes('me gusta')) {
                    
                    // Click the parent menu item if we found a formatted string
                    const clickTarget = item.closest('ytd-menu-service-item-renderer') || item;
                    clickTarget.click();
                    log("[clickRemoveFromLiked] Clicked remove from liked.");
                    return true;
                }
            }
        }

        log("[clickRemoveFromLiked] Remove option not found.");
        return false;
    }

    async function unlikeVideo() {
        log("[unlikeVideo] Searching for video to unlike...");

        // Find the first video item
        const videoItem = document.querySelector('ytd-playlist-video-renderer');
        if (!videoItem) {
            log("[unlikeVideo] No video item found.");
            return false;
        }

        // Click the menu button
        if (!await clickMenuButton(videoItem)) {
            return false;
        }

        // Click "Remove from Liked videos"
        if (!await clickRemoveFromLiked()) {
            // Try pressing Escape to close menu and retry
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27 }));
            await delay(300);
            return false;
        }

        await delay(500);

        // Wait for video to be removed from list
        const waitDelays = [100, 200, 300, 500, 500, 1000];
        for (let i = 0; i < waitDelays.length; i++) {
            await delay(waitDelays[i]);
            const stillExists = document.contains(videoItem);
            if (!stillExists) {
                log("[unlikeVideo] Video removed successfully.");
                return true;
            }
        }

        log("[unlikeVideo] Video may have been removed.");
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

            // Try scrolling down to load more items
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
            await delay(500);
        }
    }

    log(`[DeleteAllYouTubeLikes] Unlike finished. Total unliked: ${window.deletedYouTubeLikes}`);
    window.youtubeLikesDeletionDone = true;
}
