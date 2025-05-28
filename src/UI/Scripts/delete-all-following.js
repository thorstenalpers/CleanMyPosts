async function DeleteAllFollowing(waitBeforeTryClickDelete, waitBetweenTryClickDeleteAttempts, maxConfirmAttempts = 5) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isVisible(elem) {
        return elem && elem.offsetParent !== null && !elem.disabled;
    }

    async function waitForUnfollowButton(selector, maxTotalTime = 5000, interval = 200) {
        const start = Date.now();
        while (true) {
            const btn = document.querySelector(selector);
            if (btn && isVisible(btn)) {
                console.log("[waitForUnfollowButton] Found visible unfollow button");
                return true;
            }

            const elapsed = Date.now() - start;
            if (elapsed >= maxTotalTime) {
                console.log(`[waitForUnfollowButton] Timeout reached (${elapsed}ms)`);
                return false;
            }

            window.scrollBy(0, 500);
            console.log("[waitForUnfollowButton] Scrolling...");
            await delay(interval);
        }
    }

    async function clickUnfollowButtonWithConfirm() {
        const btn = document.querySelector('button[data-testid$="-unfollow"]');
        if (!btn || !isVisible(btn)) {
            console.log("[clickUnfollowButtonWithConfirm] No visible unfollow button found");
            return false;
        }

        console.log("[clickUnfollowButtonWithConfirm] Clicking unfollow button");
        btn.click();
        await delay(waitBeforeTryClickDelete);

        for (let attempt = 0; attempt < maxConfirmAttempts; attempt++) {
            const confirmBtn = document.querySelector('button[data-testid="confirmationSheetConfirm"]');
            if (confirmBtn && isVisible(confirmBtn)) {
                console.log(`[clickUnfollowButtonWithConfirm] Clicking confirm on attempt #${attempt + 1}`);
                confirmBtn.click();
                return true;
            }

            const delayTime = waitBetweenTryClickDeleteAttempts * (attempt + 1);
            console.log(`[clickUnfollowButtonWithConfirm] Confirm button not ready (attempt ${attempt + 1}), retrying in ${delayTime}ms...`);
            await delay(delayTime);
        }

        console.log("[clickUnfollowButtonWithConfirm] Failed to confirm unfollow after retries");
        return false;
    }

    async function tryUnfollow(maxTries) {
        for (let attempt = 1; attempt <= maxTries; attempt++) {
            console.log(`[tryUnfollow] Attempt #${attempt}`);
            const success = await clickUnfollowButtonWithConfirm();
            if (success) {
                console.log(`[tryUnfollow] Successfully unfollowed on attempt #${attempt}`);
                return true;
            }

            if (attempt < maxTries) {
                console.log(`[tryUnfollow] Will retry after delay...`);
                await delay(waitBetweenTryClickDeleteAttempts);
            }
        }
        return false;
    }

    let unfollowCount = 1;
    window.followingDeletionDone = false;
    window.deletedFollowing = 0;

    console.log("[DeleteAllFollowing] Starting unfollow loop...");

    while (true) {
        const found = await waitForUnfollowButton('button[data-testid$="-unfollow"]', 5000, 200);
        if (!found) {
            console.log("[DeleteAllFollowing] No unfollow buttons found after timeout.");
            break;
        }

        const success = await tryUnfollow(10);
        if (success) {
            console.log(`[DeleteAllFollowing] Unfollowed #${unfollowCount}`);
            unfollowCount++;
            window.deletedFollowing++;
        } else {
            console.log(`[DeleteAllFollowing] Could not unfollow #${unfollowCount}, aborting.`);
            break;
        }

        await delay(waitBeforeTryClickDelete);
    }

    window.followingDeletionDone = true;
    console.log(`[DeleteAllFollowing] Done. Total unfollowed: ${window.deletedFollowing}`);
}
