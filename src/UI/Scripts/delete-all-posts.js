async function DeleteAllPosts(waitAfterDelete, waitBetweenDeleteAttempts) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function waitForDeleteButton(selector, maxWait, interval) {
        const start = Date.now();
        while (true) {
            if (document.querySelector(selector)) {
                console.log("[waitForDeleteButton] Found caret button");
                return true;
            }
            const elapsed = Date.now() - start;
            if (elapsed > maxWait) {
                console.log(`[waitForDeleteButton] Timeout reached (${elapsed}ms)`);
                return false;
            }
            console.log("[waitForDeleteButton] Scrolling to look for caret button...");
            window.scrollBy(0, 500);
            await delay(interval);
        }
    }

    async function clickDeleteOnPost() {
        console.log("[clickDeleteOnPost] Looking for caret button...");
        const caretButton = document.querySelector("div[data-testid='primaryColumn'] section button[data-testid='caret']");
        if (!caretButton) {
            console.log("[clickDeleteOnPost] Caret button not found.");
            return false;
        }

        console.log("[clickDeleteOnPost] Clicking caret button");
        caretButton.click();
        await delay(waitBetweenDeleteAttempts);

        const delays = [
            waitBetweenDeleteAttempts,
            waitBetweenDeleteAttempts * 2,
            waitBetweenDeleteAttempts * 3,
            waitBetweenDeleteAttempts * 4,
            waitBetweenDeleteAttempts * 5,
        ];

        async function tryClickDelete(attempt = 0) {
            if (attempt >= delays.length) {
                console.log("[tryClickDelete] Failed to find delete option.");
                return false;
            }

            await delay(delays[attempt]);

            const menu = document.querySelector("[role='menu']");
            if (menu && menu.style.display !== "none") {
                console.log(`[tryClickDelete] Looking for delete option in menu (attempt #${attempt + 1})`);
                const items = document.querySelectorAll("[role='menuitem']");
                for (const item of items) {
                    const span = item.querySelector("span");
                    if (!span) continue;

                    const color = getComputedStyle(span).color;
                    const rgb = color.match(/\d+/g).map(Number);
                    const [r, g, b] = rgb;

                    if (r > 180 && g < 100 && b < 100) {
                        console.log("[tryClickDelete] Found and clicked delete option");
                        span.click();
                        return true;
                    }
                }

                console.log(`[tryClickDelete] Delete option not found, retrying... (attempt #${attempt + 1})`);
                return tryClickDelete(attempt + 1);
            } else {
                console.log(`[tryClickDelete] Menu not visible, retrying... (attempt #${attempt + 1})`);
                return tryClickDelete(attempt + 1);
            }
        }

        async function confirmDelete(attempt = 0) {
            if (attempt >= delays.length) {
                console.log("[confirmDelete] Failed to confirm deletion.");
                return false;
            }

            await delay(delays[attempt]);
            const confirmBtn = document.querySelector("button[data-testid='confirmationSheetConfirm']");

            if (confirmBtn && confirmBtn.offsetParent !== null) {
                console.log(`[confirmDelete] Clicking confirm delete (attempt #${attempt + 1})`);
                confirmBtn.click();
                return true;
            } else {
                console.log(`[confirmDelete] Confirm button not visible, retrying... (attempt #${attempt + 1})`);
                return confirmDelete(attempt + 1);
            }
        }

        const clickedDelete = await tryClickDelete();
        if (!clickedDelete) {
            console.log("[clickDeleteOnPost] Could not click delete from menu.");
            return false;
        }

        const confirmed = await confirmDelete();
        if (!confirmed) {
            console.log("[clickDeleteOnPost] Could not confirm deletion.");
            return false;
        }

        console.log("[clickDeleteOnPost] Post deleted successfully.");
        return true;
    }

    window.postsDeletionDone = false;
    window.deletedPosts = 0;

    let postNumber = 1;
    console.log("[DeleteAllPosts] Starting post deletion loop...");

    while (true) {
        const found = await waitForDeleteButton("div[data-testid='primaryColumn'] section button[data-testid='caret']", 5000, 200);
        if (!found) {
            console.log("[DeleteAllPosts] No more posts found to delete. Stopping.");
            break;
        }

        console.log(`[DeleteAllPosts] Attempting to delete post #${postNumber}`);
        const success = await clickDeleteOnPost();
        if (!success) {
            console.log(`[DeleteAllPosts] Failed to delete post #${postNumber}. Stopping.`);
            break;
        }

        window.deletedPosts++;
        console.log(`[DeleteAllPosts] Deleted post #${postNumber}`);
        postNumber++;

        await delay(waitAfterDelete);
    }

    window.postsDeletionDone = true;
    console.log(`[DeleteAllPosts] Deletion complete. Total posts deleted: ${window.deletedPosts}`);
}
