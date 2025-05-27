async function DeleteAllLikes(waitTime) {
    // Simple delay helper returning a Promise
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Wait for unlike button to appear, scrolling every interval until maxTotalTime
    async function waitForUnlikeButton(selector, maxTotalTime, interval) {
        const start = Date.now();

        while (true) {
            if (document.querySelector(selector)) {
                console.log("[waitForUnlikeButton] Found unlike button");
                return true;
            }

            const elapsed = Date.now() - start;
            if (elapsed >= maxTotalTime) {
                console.log(`[waitForUnlikeButton] Timeout reached (${elapsed}ms)`);
                return false;
            }

            console.log("[waitForUnlikeButton] scroll down");
            window.scrollBy(0, 500);
            await delay(interval);
        }
    }

    // Click the unlike button and wait for waitTime ms, then check if button disappeared
    async function clickUnlikeButton() {
        const btn = document.querySelector('button[data-testid="unlike"]');
        if (!btn) {
            console.log("[clickUnlikeButton] No unlike button found");
            return false;
        }

        console.log("[clickUnlikeButton] Clicking unlike button");
        btn.click();

        await delay(waitTime);
        const stillThere = !!document.querySelector('button[data-testid="unlike"]');
        console.log(`[clickUnlikeButton] Unlike button present after wait? ${stillThere}`);
        return !stillThere;
    }

    // Try clicking unlike button maxTries times before giving up
    async function tryUnlike(maxTries) {
        for (let attempt = 1; attempt <= maxTries; attempt++) {
            console.log(`[tryUnlike] Attempt #${attempt}`);
            const success = await clickUnlikeButton();
            if (success) {
                console.log(`[tryUnlike] Success on attempt #${attempt}`);
                return true;
            }
            if (attempt < maxTries) {
                console.log(`[tryUnlike] Failed attempt #${attempt}, retrying...`);
                await delay(1000);
            }
        }
        console.log(`[tryUnlike] Failed after ${maxTries} attempts`);
        return false;
    }

    // Main delete loop
    let postNumber = 1;
    window.likesDeletionDone = false;
    window.deletedLikes = 0;

    if (!document.querySelector('button[data-testid="unlike"]')) {
        console.log("[deleteAll] No unlike buttons present on page. Aborting.");
        window.likesDeletionDone = true;
        return;
    }

    while (true) {
        const found = await waitForUnlikeButton('button[data-testid="unlike"]', 5000, 200);
        if (!found) {
            console.log("[deleteAll] No unlike buttons found after timeout. Stopping.");
            window.likesDeletionDone = true;
            break;
        }

        const deleted = await tryUnlike(10);
        if (deleted) {
            console.log(`[deleteAll] Deleted like #${postNumber}`);
            window.deletedLikes++;
            postNumber++;
        } else {
            console.log(`[deleteAll] Failed to delete like #${postNumber}, stopping.`);
            window.likesDeletionDone = true;
            break;
        }
    }
}
