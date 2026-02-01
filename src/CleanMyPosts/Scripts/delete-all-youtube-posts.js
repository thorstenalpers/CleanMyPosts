async function DeleteAllYouTubePosts(waitAfterDelete, waitBetweenDeleteAttempts) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function log(msg) {
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
    }

    async function waitForDeleteButton(maxWait = 5000, interval = 300) {
        const start = Date.now();
        while (true) {
            // Find X buttons on Google My Activity page for YouTube comments
            const deleteButton = document.querySelector('button[aria-label^="Delete activity item"]');
            if (deleteButton) {
                log("[waitForDeleteButton] Found delete button.");
                return true;
            }

            const elapsed = Date.now() - start;
            if (elapsed > maxWait) {
                log(`[waitForDeleteButton] Timeout after ${elapsed}ms.`);
                return false;
            }

            window.scrollBy(0, 400);
            await delay(interval);
        }
    }

    async function clickDeleteButton() {
        log("[clickDeleteButton] Searching for delete button...");
        
        // Find the X button (delete button) on Google My Activity page
        const deleteButton = document.querySelector('button[aria-label^="Delete activity item"]');
        if (!deleteButton) {
            log("[clickDeleteButton] Delete button not found.");
            return false;
        }

        deleteButton.click();
        log("[clickDeleteButton] Clicked delete button.");
        await delay(waitBetweenDeleteAttempts);

        // Wait for the item to be removed from DOM
        const delays = [100, 200, 300, 500, 500, 500, 1000];

        for (let i = 0; i < delays.length; i++) {
            await delay(delays[i]);
            
            // Check if item was deleted (button should no longer exist or be in removing state)
            const stillExists = document.contains(deleteButton);
            if (!stillExists) {
                log("[clickDeleteButton] Item deleted successfully.");
                return true;
            }
        }

        log("[clickDeleteButton] Item may have been deleted.");
        return true;
    }

    window.youtubePostsDeletionDone = false;
    window.deletedYouTubePosts = 0;
    log("[DeleteAllYouTubePosts] Starting deletion loop on Google My Activity...");

    let failures = 0;
    const maxFailures = 3;
    let commentNumber = 1;

    while (failures < maxFailures) {
        const found = await waitForDeleteButton(5000, 300);
        if (!found) {
            failures++;
            log(`[DeleteAllYouTubePosts] No delete button found (failure #${failures}). Scrolling...`);

            // Try scrolling down to load more items
            const prevScroll = window.scrollY;
            window.scrollBy(0, 500);
            await delay(500);

            // Also try clicking "Load more" button if present
            const loadMoreBtn = document.querySelector('button[jsname="T8gEfd"]');
            if (loadMoreBtn && loadMoreBtn.offsetParent !== null) {
                loadMoreBtn.click();
                log("[DeleteAllYouTubePosts] Clicked 'Load more' button.");
                await delay(1000);
                failures = 0;
                continue;
            }

            if (window.scrollY === prevScroll) {
                log("[DeleteAllYouTubePosts] No scroll change. Assuming no more comments.");
                break;
            }

            continue;
        }

        log(`[DeleteAllYouTubePosts] Deleting comment #${commentNumber}...`);
        const success = await clickDeleteButton();

        if (success) {
            window.deletedYouTubePosts++;
            log(`[DeleteAllYouTubePosts] Deleted comment #${commentNumber}`);
            commentNumber++;
            failures = 0;
            await delay(waitAfterDelete);
        } else {
            failures++;
            log(`[DeleteAllYouTubePosts] Failed to delete comment #${commentNumber} (failure #${failures})`);
            await delay(500);
        }
    }

    log(`[DeleteAllYouTubePosts] Deletion finished. Total deleted: ${window.deletedYouTubePosts}`);
    window.youtubePostsDeletionDone = true;
}
