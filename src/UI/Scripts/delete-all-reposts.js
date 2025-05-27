async function DeleteAllRepost(waitTime) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isVisible(elem) {
        return elem && elem.offsetParent !== null && !elem.disabled;
    }

    async function waitForUnretweetButton(selector, maxTotalTime, interval) {
        const start = Date.now();
        while (true) {
            const btn = document.querySelector(selector);
            if (btn && isVisible(btn)) {
                console.log("[waitForUnretweetButton] Found unretweet button");
                return true;
            }

            const elapsed = Date.now() - start;
            if (elapsed >= maxTotalTime) {
                console.log(`[waitForUnretweetButton] Timeout reached (${elapsed}ms)`);
                return false;
            }

            console.log("[waitForUnretweetButton] Scrolling to find button...");
            window.scrollBy(0, 500);
            await delay(interval);
        }
    }

    async function clickUnretweetButtonWithRetry(maxTries = 5) {
        for (let attempt = 1; attempt <= maxTries; attempt++) {
            const btn = document.querySelector('button[data-testid="unretweet"]');
            if (btn && isVisible(btn)) {
                console.log(`[clickUnretweetButton] Clicking unretweet (attempt ${attempt})`);
                btn.click();
                await delay(500);

                const confirmResult = await confirmUnretweet(waitTime);
                if (confirmResult) return true;
            } else {
                console.log(`[clickUnretweetButton] Button not found or not visible (attempt ${attempt})`);
            }

            await delay(500);
        }

        console.log("[clickUnretweetButtonWithRetry] Failed to unretweet after retries.");
        return false;
    }

    async function confirmUnretweet(waitTime, maxRetries = 5) {
        const delays = Array.from({ length: maxRetries }, (_, i) => waitTime * (i + 1));
        for (let i = 0; i < delays.length; i++) {
            await delay(delays[i]);

            const menuItem = document.querySelector('div[role="menuitem"][data-testid="unretweetConfirm"]');
            if (menuItem && isVisible(menuItem)) {
                console.log(`[confirmUnretweet] Confirming unretweet (attempt ${i + 1})`);
                menuItem.click();
                await delay(waitTime);
                return true;
            } else {
                console.log(`[confirmUnretweet] Confirm button not ready (attempt ${i + 1})`);
            }
        }

        console.log("[confirmUnretweet] Failed to confirm after retries.");
        return false;
    }

    // MAIN LOOP
    let postNumber = 1;
    let deletedCount = 0;
    window.repostsDeletionDone = false;

    console.log("[DeleteAllRepost] Starting repost deletion loop...");

    while (true) {
        const found = await waitForUnretweetButton('button[data-testid="unretweet"]', 5000, 200);
        if (!found) {
            console.log("[DeleteAllRepost] No more unretweet buttons found.");
            break;
        }

        const deleted = await clickUnretweetButtonWithRetry(5);
        if (deleted) {
            console.log(`[DeleteAllRepost] Deleted repost #${postNumber}`);
            postNumber++;
            deletedCount++;
        } else {
            console.log(`[DeleteAllRepost] Failed to delete repost #${postNumber}, stopping.`);
            break;
        }

        await delay(waitTime);
    }

    window.deletedReposts = deletedCount;
    window.repostsDeletionDone = true;
    console.log(`[DeleteAllRepost] Done. Total reposts deleted: ${deletedCount}`);
}
