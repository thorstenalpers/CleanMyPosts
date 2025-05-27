async function DeleteAllReplies(userName, waitAfterDelete, waitBetweenDeleteAttempts) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isVisible(elem) {
        return elem && elem.offsetParent !== null && !elem.disabled;
    }

    async function findVisibleCaretWithRetry(article, maxRetries = 7, delayMs = 300) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const caret = article.querySelector("button[data-testid='caret']");
            if (caret && isVisible(caret)) {
                return caret;
            }
            await delay(delayMs);
        }
        return null;
    }

    async function clickCaretWithScrollRetry() {
        const maxScrollAttempts = 6;
        const scrollDelay = 1000; // ms
        for (let scrollAttempt = 0; scrollAttempt < maxScrollAttempts; scrollAttempt++) {
            const articles = Array.from(document.querySelectorAll("article[data-testid='tweet']"));
            const target = articles.find(article => article.querySelector(`a[href*="/${userName}"]`));

            if (target) {
                const caret = await findVisibleCaretWithRetry(target, 7, 300);
                if (!caret) {
                    console.log("[clickCaretWithScrollRetry] Caret found but not visible after retries.");
                    return false;
                }
                caret.click();
                return true;
            }

            // Not found yet: scroll to load more replies and wait
            console.log(`[clickCaretWithScrollRetry] Caret not found, scrolling attempt ${scrollAttempt + 1}...`);
            window.scrollBy(0, 1500);
            await delay(scrollDelay);
        }
        console.log("[clickCaretWithScrollRetry] Caret not found after scrolling attempts.");
        return false;
    }

    async function tryClickDelete(attempt = 0) {
        const delays = [
            waitBetweenDeleteAttempts,
            waitBetweenDeleteAttempts * 2,
            waitBetweenDeleteAttempts * 3,
            waitBetweenDeleteAttempts * 4,
            waitBetweenDeleteAttempts * 5,
        ];

        if (attempt >= delays.length) return false;

        await delay(delays[attempt]);

        const menu = document.querySelector("[role='menu']");
        if (menu && menu.style.display !== "none") {
            const items = document.querySelectorAll("[role='menuitem']");
            for (const item of items) {
                const span = item.querySelector("span");
                if (!span) continue;

                const color = getComputedStyle(span).color;
                const rgb = color.match(/\d+/g).map(Number);
                const [r, g, b] = rgb;

                if (r > 180 && g < 100 && b < 100) {
                    span.click();
                    return true;
                }
            }
            return tryClickDelete(attempt + 1);
        } else {
            return tryClickDelete(attempt + 1);
        }
    }

    async function confirmDelete(attempt = 0) {
        const delays = [
            waitBetweenDeleteAttempts,
            waitBetweenDeleteAttempts * 2,
            waitBetweenDeleteAttempts * 3,
            waitBetweenDeleteAttempts * 4,
            waitBetweenDeleteAttempts * 5,
        ];

        if (attempt >= delays.length) return false;

        await delay(delays[attempt]);

        const confirmBtn = document.querySelector("button[data-testid='confirmationSheetConfirm']");
        if (confirmBtn && confirmBtn.offsetParent !== null) {
            confirmBtn.click();
            return true;
        } else {
            return confirmDelete(attempt + 1);
        }
    }

    async function waitForReplyCaret(maxWait, interval) {
        const start = Date.now();
        while (true) {
            const caret = document.querySelector("article[data-testid='tweet'] button[data-testid='caret']");
            if (caret) return true;

            if ((Date.now() - start) > maxWait) return false;

            window.scrollBy(0, 500);
            await delay(interval);
        }
    }

    window.repliesDeletionDone = false;
    window.deletedReplies = 0;

    while (true) {
        const found = await waitForReplyCaret(5000, 200);
        if (!found) {
            console.log("[DeleteAllReplies] No more replies found.");
            break;
        }

        const caretClicked = await clickCaretWithScrollRetry();
        if (!caretClicked) {
            console.log("[DeleteAllReplies] Failed to find and click caret.");
            break;
        }

        await delay(waitBetweenDeleteAttempts);

        const clickedDelete = await tryClickDelete();
        if (!clickedDelete) {
            console.log("[DeleteAllReplies] Failed to click delete option.");
            break;
        }

        const confirmed = await confirmDelete();
        if (!confirmed) {
            console.log("[DeleteAllReplies] Failed to confirm delete.");
            break;
        }

        window.deletedReplies++;
        await delay(waitAfterDelete);
    }

    window.repliesDeletionDone = true;
    console.log(`[DeleteAllReplies] Completed. Total replies deleted: ${window.deletedReplies}`);
}
