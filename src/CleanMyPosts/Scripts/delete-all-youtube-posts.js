async function DeleteAllYouTubePosts(waitAfterDelete, waitBetweenDeleteAttempts) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function log(msg) {
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
    }

    async function waitForPost(maxWait = 5000, interval = 300) {
        const start = Date.now();
        while (true) {
            const post = document.querySelector('ytd-backstage-post-thread-renderer');
            if (post) {
                log("[waitForPost] Found community post.");
                return true;
            }

            const elapsed = Date.now() - start;
            if (elapsed > maxWait) {
                log(`[waitForPost] Timeout after ${elapsed}ms.`);
                return false;
            }

            window.scrollBy(0, 400);
            await delay(interval);
        }
    }

    async function clickDeleteOnPost() {
        log("[clickDeleteOnPost] Searching for post menu button...");
        
        const post = document.querySelector('ytd-backstage-post-thread-renderer');
        if (!post) {
            log("[clickDeleteOnPost] No post found.");
            return false;
        }

        const menuButton = post.querySelector('button[aria-label="Action menu"], #menu-button button, yt-icon-button#menu-button');
        if (!menuButton) {
            log("[clickDeleteOnPost] Menu button not found on post.");
            return false;
        }

        menuButton.click();
        await delay(waitBetweenDeleteAttempts);

        const delays = [100, 200, 300, 500, 500, 500, 500, 500, 1000, 1000];

        async function tryClickDelete(attempt = 0) {
            if (attempt >= delays.length) {
                log("[tryClickDelete] Delete option not found after retries.");
                return false;
            }

            await delay(delays[attempt]);

            const menuItems = document.querySelectorAll('tp-yt-paper-listbox ytd-menu-service-item-renderer, ytd-menu-popup-renderer ytd-menu-service-item-renderer');
            for (const item of menuItems) {
                const text = item.textContent.toLowerCase();
                if (text.includes('delete') || text.includes('löschen') || text.includes('supprimer') || text.includes('eliminar')) {
                    item.click();
                    log("[tryClickDelete] Clicked delete option.");
                    return true;
                }
            }

            const paperItems = document.querySelectorAll('tp-yt-paper-item');
            for (const item of paperItems) {
                const text = item.textContent.toLowerCase();
                if (text.includes('delete') || text.includes('löschen') || text.includes('supprimer') || text.includes('eliminar')) {
                    item.click();
                    log("[tryClickDelete] Clicked delete option (paper-item).");
                    return true;
                }
            }

            log(`[tryClickDelete] Delete option not found (attempt #${attempt + 1})`);
            return tryClickDelete(attempt + 1);
        }

        async function confirmDelete(attempt = 0) {
            if (attempt >= delays.length) {
                log("[confirmDelete] Confirm button not found after retries.");
                return false;
            }

            await delay(delays[attempt]);

            const confirmButtons = document.querySelectorAll('tp-yt-paper-button, yt-button-renderer button, #confirm-button button');
            for (const btn of confirmButtons) {
                const text = btn.textContent.toLowerCase();
                if (text.includes('delete') || text.includes('löschen') || text.includes('supprimer') || text.includes('eliminar') || text.includes('confirm')) {
                    if (btn.offsetParent !== null) {
                        btn.click();
                        log(`[confirmDelete] Clicked confirm (attempt #${attempt + 1})`);
                        return true;
                    }
                }
            }

            const dialogButtons = document.querySelectorAll('ytd-button-renderer button, tp-yt-paper-dialog button');
            for (const btn of dialogButtons) {
                const text = btn.textContent.toLowerCase();
                if (text.includes('delete') || text.includes('löschen') || text.includes('supprimer') || text.includes('eliminar')) {
                    if (btn.offsetParent !== null) {
                        btn.click();
                        log(`[confirmDelete] Clicked confirm dialog button (attempt #${attempt + 1})`);
                        return true;
                    }
                }
            }

            log(`[confirmDelete] Confirm button not visible (attempt #${attempt + 1})`);
            return confirmDelete(attempt + 1);
        }

        const deleteClicked = await tryClickDelete();
        if (!deleteClicked) return false;

        const confirmed = await confirmDelete();
        if (!confirmed) return false;

        log("[clickDeleteOnPost] Post deleted.");
        return true;
    }

    window.youtubePostsDeletionDone = false;
    window.deletedYouTubePosts = 0;
    log("[DeleteAllYouTubePosts] Starting deletion loop...");

    let failures = 0;
    const maxFailures = 3;
    let postNumber = 1;

    while (failures < maxFailures) {
        const found = await waitForPost(5000, 300);
        if (!found) {
            failures++;
            log(`[DeleteAllYouTubePosts] No post found (failure #${failures}). Scrolling up...`);

            const prevScroll = window.scrollY;
            window.scrollTo(0, 0);
            await delay(500);

            if (window.scrollY === prevScroll) {
                log("[DeleteAllYouTubePosts] No scroll change. Assuming no more posts.");
                break;
            }

            continue;
        }

        log(`[DeleteAllYouTubePosts] Deleting post #${postNumber}...`);
        const success = await clickDeleteOnPost();

        if (success) {
            window.deletedYouTubePosts++;
            log(`[DeleteAllYouTubePosts] Deleted post #${postNumber}`);
            postNumber++;
            failures = 0;
            await delay(waitAfterDelete);
        } else {
            failures++;
            log(`[DeleteAllYouTubePosts] Failed to delete post #${postNumber} (failure #${failures})`);
            await delay(500);
        }
    }

    log(`[DeleteAllYouTubePosts] Deletion finished. Total deleted: ${window.deletedYouTubePosts}`);
    window.youtubePostsDeletionDone = true;
}
