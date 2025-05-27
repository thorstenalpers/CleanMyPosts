async function DeleteAllFollowing(waitBeforeTryClickDelete, waitBetweenTryClickDeleteAttempts, maxConfirmAttempts = 5) {
    // Simple delay helper returning a Promise
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Wait for unfollow button to appear, scrolling every interval until maxTotalTime
    async function waitForUnfollowButton(selector, maxTotalTime = 5000, interval = 200) {
        const start = Date.now();

        while (true) {
            if (document.querySelector(selector)) {
                console.log("[waitForUnfollowButton] Found unfollow button");
                return true;
            }

            const elapsed = Date.now() - start;
            if (elapsed >= maxTotalTime) {
                console.log(`[waitForUnfollowButton] Timeout reached (${elapsed}ms)`);
                return false;
            }

            console.log("[waitForUnfollowButton] scroll down");
            window.scrollBy(0, 500);
            await delay(interval);
        }
    }

    // Click unfollow button and handle confirmation retries with delays
    async function clickUnfollowButtonWithConfirm() {
        const btn = document.querySelector('button[data-testid$="-unfollow"]');
        if (!btn) {
            console.log("[clickUnfollowButtonWithConfirm] No unfollow button found");
            return false;
        }

        console.log("[clickUnfollowButtonWithConfirm] Clicking unfollow button");
        btn.click();

        // Wait before trying to click confirm
        await delay(waitBeforeTryClickDelete);

        // Try clicking confirm button multiple times with increasing delays
        for (let attempt = 0; attempt < maxConfirmAttempts; attempt++) {
            const confirmBtn = document.querySelector('button[data-testid="confirmationSheetConfirm"]');
            if (confirmBtn && confirmBtn.offsetParent !== null) {
                console.log(`[clickUnfollowButtonWithConfirm] Clicking confirm button on attempt #${attempt + 1}`);
                confirmBtn.click();
                return true;
            } else {
                console.log(`[clickUnfollowButtonWithConfirm] Confirm button not visible on attempt #${attempt + 1}, retrying after delay...`);
                await delay(waitBetweenTryClickDeleteAttempts * (attempt + 1));
            }
        }

        console.log("[clickUnfollowButtonWithConfirm] Failed to find or click confirm button after retries");
        return false;
    }

    // Try unfollow maxTries times before giving up on current item
    async function tryUnfollow(maxTries) {
        for (let attempt = 1; attempt <= maxTries; attempt++) {
            console.log(`[tryUnfollow] Attempt #${attempt}`);
            const success = await clickUnfollowButtonWithConfirm();
            if (success) {
                console.log(`[tryUnfollow] Success on attempt #${attempt}`);
                return true;
            }
            if (attempt < maxTries) {
                console.log(`[tryUnfollow] Failed attempt #${attempt}, retrying...`);
                await delay(waitBetweenTryClickDeleteAttempts);
            }
        }
        console.log(`[tryUnfollow] Failed after ${maxTries} attempts`);
        return false;
    }

    // Main delete loop
    let unfollowCount = 1;
    window.followingDeletionDone = false;
    window.deletedFollowing = 0;

    if (!document.querySelector('button[data-testid$="-unfollow"]')) {
        console.log("[deleteAllFollowing] No unfollow buttons present on page. Aborting.");
        window.followingDeletionDone = true;
        return;
    }

    while (true) {
        const found = await waitForUnfollowButton('button[data-testid$="-unfollow"]', 5000, 200);
        if (!found) {
            console.log("[deleteAllFollowing] No unfollow buttons found after timeout. Stopping.");
            window.followingDeletionDone = true;
            break;
        }

        const unfollowed = await tryUnfollow(5); // for example, max 5 tries per unfollow
        if (unfollowed) {
            console.log(`[deleteAllFollowing] Unfollowed #${unfollowCount}`);
            unfollowCount++;
            window.deletedFollowing++;
        } else {
            console.log(`[deleteAllFollowing] Failed to unfollow #${unfollowCount}, stopping.`);
            window.followingDeletionDone = true;
            break;
        }
    }
}
