async function DeleteAllLikes(waitTime) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isVisible(el) {
        return el && el.offsetParent !== null;
    }

    async function waitForUnlikeButton(selector, maxTotalTime = 5000, interval = 200) {
        const start = Date.now();
        while (true) {
            const btn = document.querySelector(selector);
            if (btn && isVisible(btn)) {
                console.log("[waitForUnlikeButton] Found visible unlike button");
                return true;
            }

            const elapsed = Date.now() - start;
            if (elapsed >= maxTotalTime) {
                console.log(`[waitForUnlikeButton] Timeout reached (${elapsed}ms)`);
                return false;
            }

            console.log("[waitForUnlikeButton] Scrolling down...");
            window.scrollBy(0, 500);
            await delay(interval);
        }
    }

    async function clickUnlikeButton() {
        const btn = document.querySelector('button[data-testid="unlike"]');
        if (!btn || !isVisible(btn)) {
            console.log("[clickUnlikeButton] No visible unlike button found");
            return false;
        }

        console.log("[clickUnlikeButton] Clicking unlike button");
        btn.click();
        await delay(waitTime);

        const stillPresent = document.querySelector('button[data-testid="unlike"]');
        const success = !stillPresent;
        console.log(`[clickUnlikeButton] Unlike button still present after delay? ${!!stillPresent}`);
        return success;
    }

    async function tryUnlike(maxTries) {
        for (let attempt = 1; attempt <= maxTries; attempt++) {
            console.log(`[tryUnlike] Attempt #${attempt}`);
            const success = await clickUnlikeButton();
            if (success) {
                console.log(`[tryUnlike] Success on attempt #${attempt}`);
                return true;
            }

            if (attempt < maxTries) {
                const backoff = 500 + 500 * attempt;
                console.log(`[tryUnlike] Failed attempt #${attempt}, retrying in ${backoff}ms...`);
                await delay(backoff);
            }
        }

        console.log(`[tryUnlike] Failed after ${maxTries} attempts`);
        return false;
    }

    let postNumber = 1;
    window.likesDeletionDone = false;
    window.deletedLikes = 0;

    console.log("[DeleteAllLikes] Starting unlike loop...");

    while (true) {
        const found = await waitForUnlikeButton('button[data-testid="unlike"]', 5000, 200);
        if (!found) {
            console.log("[DeleteAllLikes] No unlike buttons found. Ending.");
            break;
        }

        const success = await tryUnlike(10);
        if (success) {
            console.log(`[DeleteAllLikes] Deleted like #${postNumber}`);
            postNumber++;
            window.deletedLikes++;
        } else {
            console.log(`[DeleteAllLikes] Failed to delete like #${postNumber}, stopping.`);
            break;
        }

        await delay(waitTime);
    }

    window.likesDeletionDone = true;
    console.log(`[DeleteAllLikes] Completed. Total likes removed: ${window.deletedLikes}`);
}
