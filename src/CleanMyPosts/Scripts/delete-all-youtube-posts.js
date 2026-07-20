// Delete all YouTube comments via Google My Activity
// URL: https://myactivity.google.com/page?hl=en&page=youtube_comments
// Usage: DeleteAllYouTubeComments(1000, 500);
// Parameters:
//   waitAfterDelete: milliseconds to wait after each deletion (default: 1000)
//   waitBetweenDeleteAttempts: milliseconds to wait between retry attempts (default: 500)

async function DeleteAllYouTubeComments(waitAfterDelete = 1000, waitBetweenDeleteAttempts = 500) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function log(msg) {
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
    }

    // A Google feedback/survey dialog can pop up mid-run and, being modal, blocks
    // the next delete click. Dismiss it whenever it appears.
    function dismissSurveyBanner() {
        const closeBtn = document.querySelector('button[aria-label="Close this dialog"]');
        if (closeBtn && closeBtn.getBoundingClientRect().width > 0) {
            closeBtn.click();
            log("[dismissSurveyBanner] Dismissed feedback/survey banner.");
            return true;
        }
        return false;
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

    async function clickConfirmDeleteButton() {
        // Wait for confirmation dialog and click "Delete" button
        const delays = [100, 200, 300, 500, 500, 500, 1000, 1000];
        
        for (let i = 0; i < delays.length; i++) {
            await delay(delays[i]);
            
            // Find the Delete button in the confirmation dialog
            // It has data-id="EBS5u" or contains text "Delete" in span with class "Crf1o"
            const confirmDeleteBtn = document.querySelector('div[role="button"][data-id="EBS5u"]');
            if (confirmDeleteBtn && confirmDeleteBtn.offsetParent !== null) {
                confirmDeleteBtn.click();
                log("[clickConfirmDeleteButton] Clicked confirm Delete button.");
                return true;
            }
            
            // Alternative: find by text content
            const allButtons = document.querySelectorAll('div[role="button"]');
            for (const btn of allButtons) {
                const deleteSpan = btn.querySelector('span.Crf1o');
                if (deleteSpan && deleteSpan.textContent.toLowerCase().includes('delete')) {
                    btn.click();
                    log("[clickConfirmDeleteButton] Clicked confirm Delete button (by text).");
                    return true;
                }
            }
        }
        
        log("[clickConfirmDeleteButton] Confirm dialog not found or already dismissed.");
        return false;
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
        log("[clickDeleteButton] Clicked X button.");
        await delay(waitBetweenDeleteAttempts);

        // Handle confirmation dialog
        await clickConfirmDeleteButton();
        await delay(300);

        // Wait for the item to be removed from DOM
        const waitDelays = [100, 200, 300, 500, 500, 500, 1000];

        for (let i = 0; i < waitDelays.length; i++) {
            await delay(waitDelays[i]);
            
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

    window.youtubeCommentsDeletionDone = false;
    window.deletedYouTubeComments = 0;
    log("[DeleteAllYouTubeComments] Starting deletion loop on Google My Activity...");
    log("[DeleteAllYouTubeComments] Make sure you are on: https://myactivity.google.com/page?hl=en&page=youtube_comments");

    let failures = 0;
    const maxFailures = 3;
    let commentNumber = 1;

    while (failures < maxFailures) {
        dismissSurveyBanner();
        const found = await waitForDeleteButton(5000, 300);
        if (!found) {
            failures++;
            log(`[DeleteAllYouTubeComments] No delete button found (failure #${failures}). Scrolling...`);

            // Try scrolling down to load more items
            const prevScroll = window.scrollY;
            window.scrollBy(0, 500);
            await delay(500);

            // Also try clicking "Load more" button if present
            const loadMoreBtn = document.querySelector('button[jsname="T8gEfd"]');
            if (loadMoreBtn && loadMoreBtn.offsetParent !== null) {
                loadMoreBtn.click();
                log("[DeleteAllYouTubeComments] Clicked 'Load more' button.");
                await delay(1000);
                failures = 0;
                continue;
            }

            if (window.scrollY === prevScroll) {
                log("[DeleteAllYouTubeComments] No scroll change. Assuming no more comments.");
                break;
            }

            continue;
        }

        log(`[DeleteAllYouTubeComments] Deleting comment #${commentNumber}...`);
        const success = await clickDeleteButton();

        if (success) {
            window.deletedYouTubeComments++;
            log(`[DeleteAllYouTubeComments] Deleted comment #${commentNumber}`);
            commentNumber++;
            failures = 0;
            await delay(waitAfterDelete);
        } else {
            failures++;
            log(`[DeleteAllYouTubeComments] Failed to delete comment #${commentNumber} (failure #${failures})`);
            await delay(500);
        }
    }

    log(`[DeleteAllYouTubeComments] Deletion finished. Total deleted: ${window.deletedYouTubeComments}`);
    window.youtubeCommentsDeletionDone = true;
}

// Alias for backward compatibility with app
async function DeleteAllYouTubePosts(waitAfterDelete, waitBetweenDeleteAttempts) {
    await DeleteAllYouTubeComments(waitAfterDelete, waitBetweenDeleteAttempts);
    window.youtubePostsDeletionDone = window.youtubeCommentsDeletionDone;
    window.deletedYouTubePosts = window.deletedYouTubeComments;
}
