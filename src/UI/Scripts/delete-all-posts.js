async function DeleteAllPosts(waitAfterDelete, waitBetweenDeleteAttempts) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function log(msg) {
        console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
    }

    async function waitForDeleteButton(selector, maxWait = 8000, interval = 300) {
        const start = Date.now();
        while (true) {
            const caret = document.querySelector(selector);
            if (caret) {
                log("[waitForDeleteButton] Found caret button.");
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

    async function clickDeleteOnPost() {
        log("[clickDeleteOnPost] Searching for caret button...");

        const caretButton = document.querySelector("div[data-testid='primaryColumn'] section button[data-testid='caret']");
        if (!caretButton) {
            log("[clickDeleteOnPost] Caret button not found.");
            return false;
        }

        caretButton.click();
        await delay(waitBetweenDeleteAttempts);

        const delays = [1, 2, 3, 4, 5].map(i => i * waitBetweenDeleteAttempts);

        async function tryClickDelete(attempt = 0) {
            if (attempt >= delays.length) {
                log("[tryClickDelete] Delete option not found after retries.");
                return false;
            }

            await delay(delays[attempt]);

            const menu = document.querySelector("[role='menu']");
            if (!menu || menu.style.display === "none") {
                log(`[tryClickDelete] Menu not visible (attempt #${attempt + 1})`);
                return tryClickDelete(attempt + 1);
            }

            const items = menu.querySelectorAll("[role='menuitem']");
            for (const item of items) {
                const span = item.querySelector("span");
                if (!span) continue;

                const color = getComputedStyle(span).color;
                const [r, g, b] = color.match(/\d+/g).map(Number);
                if (r > 180 && g < 100 && b < 100) {
                    span.click();
                    log("[tryClickDelete] Clicked delete option.");
                    return true;
                }
            }

            log(`[tryClickDelete] Delete option not found (attempt #${attempt + 1})`);
            return tryClickDelete(attempt + 1);
        }

        async function confirmDelete(attempt = 0) {
            if (attempt >= delays.length) {
                log("[confirmDelete] Confirm delete button not found after retries.");
                return false;
            }

            await delay(delays[attempt]);

            const confirmBtn = document.querySelector("button[data-testid='confirmationSheetConfirm']");
            if (confirmBtn && confirmBtn.offsetParent !== null) {
                confirmBtn.click();
                log(`[confirmDelete] Clicked confirm (attempt #${attempt + 1})`);
                return true;
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

    window.postsDeletionDone = false;
    window.deletedPosts = 0;

    log("[DeleteAllPosts] Starting deletion loop...");

    let failures = 0;
    const maxFailures = 3;
    let postNumber = 1;

    while (failures < maxFailures) {
        const found = await waitForDeleteButton("div[data-testid='primaryColumn'] section button[data-testid='caret']", 8000, 300);
        if (!found) {
            failures++;
            log(`[DeleteAllPosts] No post found (failure #${failures}). Scrolling up for retry...`);
            window.scrollTo(0, 0);
            await delay(500);
            continue;
        }

        log(`[DeleteAllPosts] Deleting post #${postNumber}...`);
        const success = await clickDeleteOnPost();
        if (success) {
            window.deletedPosts++;
            log(`[DeleteAllPosts] Deleted post #${postNumber}`);
            postNumber++;
            failures = 0;
            await delay(waitAfterDelete);
        } else {
            failures++;
            log(`[DeleteAllPosts] Failed to delete post #${postNumber} (failure #${failures})`);
            await delay(500);
        }
    }

    log(`[DeleteAllPosts] Deletion finished. Total deleted: ${window.deletedPosts}`);
    window.postsDeletionDone = true;
}
