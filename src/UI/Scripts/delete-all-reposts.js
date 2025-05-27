async function DeleteAllRepost(waitTime) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function waitForUnretweetButton(selector, maxTotalTime, interval) {
        const start = Date.now();
        while (true) {
            if (document.querySelector(selector)) {
                console.log("[waitForUnretweetButton] Found unretweet button");
                return true;
            }

            const elapsed = Date.now() - start;
            if (elapsed >= maxTotalTime) {
                console.log(`[waitForUnretweetButton] Timeout reached (${elapsed}ms)`);
                return false;
            }

            console.log("[waitForUnretweetButton] scroll down");
            window.scrollBy(0, 500);
            await delay(interval);
        }
    }

    async function clickUnretweetButton() {
        const btn = document.querySelector('button[data-testid="unretweet"]');
        if (!btn) {
            console.log("[clickUnretweetButton] No unretweet button found");
            return false;
        }

        console.log("[clickUnretweetButton] Clicking unretweet button");
        btn.click();
        await delay(500);

        for (let i = 0; i < 5; i++) {
            await delay(waitTime);
            const menuItem = document.querySelector('div[role="menuitem"][data-testid="unretweetConfirm"]');
            if (menuItem) {
                console.log("[clickUnretweetButton] Confirming unretweet");
                menuItem.click();
                await delay(waitTime);
                return true;
            }
        }

        console.log("[clickUnretweetButton] Failed to confirm unretweet");
        return false;
    }

    async function tryUnretweet(maxTries) {
        for (let attempt = 1; attempt <= maxTries; attempt++) {
            console.log(`[tryUnretweet] Attempt #${attempt}`);
            const success = await clickUnretweetButton();
            if (success) {
                console.log(`[tryUnretweet] Success on attempt #${attempt}`);
                return true;
            }
            await delay(1000);
        }
        return false;
    }

    let postNumber = 1;
    let deletedCount = 0;
    window.repostsDeletionDone = false;

    while (true) {
        const found = await waitForUnretweetButton('button[data-testid="unretweet"]', 5000, 200);
        if (!found) {
            console.log("[deleteAllRepost] No unretweet buttons found. Ending.");
            break;
        }

        const deleted = await tryUnretweet(5);
        if (deleted) {
            console.log(`[deleteAllRepost] Deleted repost #${postNumber}`);
            postNumber++;
            deletedCount++;
        } else {
            console.log(`[deleteAllRepost] Failed to delete repost #${postNumber}, stopping.`);
            break;
        }
    }

    window.deletedReposts = deletedCount;
    window.repostsDeletionDone = true;
}
