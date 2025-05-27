async function DeleteAllReplies(userName, waitAfterDelete, waitBetweenDeleteAttempts) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    // Retry helper to find caret button inside a given article element
    async function findCaretWithRetry(article, maxRetries = 5, delayMs = 300) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const caret = article.querySelector("button[data-testid='caret']");
            if (caret) return caret;
            await delay(delayMs);
        }
        return null;
    }

    async function clickDeleteOnReply() {
        const maxAttempts = 6;
        const scrollDelay = 1000; // 1 second between scrolls

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const articles = Array.from(document.querySelectorAll("article[data-testid='tweet']"));
            const target = articles.find(article => {
                // Check if article contains a reply link with username
                const isReply = article.querySelector('a[href*="/' + userName + '"]');
                return isReply;
            });

            if (target) {
                // Found a reply article - find caret with retry
                const caret = await findCaretWithRetry(target, 7, 300);
                if (!caret) {
                    console.log("[clickDeleteOnReply] Caret not found after retries.");
                    return false;
                }

                caret.click();

                await delay(waitBetweenDeleteAttempts);

                const delays = [
                    waitBetweenDeleteAttempts,
                    waitBetweenDeleteAttempts * 2,
                    waitBetweenDeleteAttempts * 3,
                    waitBetweenDeleteAttempts * 4,
                    waitBetweenDeleteAttempts * 5,
                ];

                async function tryClickDelete(attempt = 0) {
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

                const clickedDelete = await tryClickDelete();
                if (!clickedDelete) return false;

                const confirmed = await confirmDelete();
                return confirmed;
            }

            // No reply found yet - scroll to load more replies and wait
            console.log(`[clickDeleteOnReply] No reply found, scrolling attempt ${attempt + 1}...`);
            window.scrollBy(0, 1500);
            await delay(scrollDelay);
        }

        console.log("[clickDeleteOnReply] No reply found after scrolling attempts.");
        return false;
    }


    window.repliesDeletionDone = false;
    window.deletedReplies = 0;

    while (true) {
        const found = await waitForReplyCaret(5000, 200);
        if (!found) {
            console.log("[DeleteAllReplies] No more replies found.");
            break;
        }

        const success = await clickDeleteOnReply();
        if (!success) {
            console.log("[DeleteAllReplies] Failed to delete reply.");
            break;
        }

        window.deletedReplies++;
        await delay(waitAfterDelete);
    }

    window.repliesDeletionDone = true;
}
