async function DeleteAllReplies(userName, waitAfterDelete, waitBetweenDeleteAttempts) {
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isVisible(el) {
        return el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    function isReplyByUser(article, userName) {
        const userLink = article.querySelector(`a[href^="/${userName}"]`);
        const repostMarker = article.innerText.includes("Reposted");
        return userLink && !repostMarker;
    }

    async function waitForReplyCaret(maxWait = 5000, interval = 200) {
        const start = Date.now();
        while (Date.now() - start < maxWait) {
            const articles = Array.from(document.querySelectorAll("article[data-testid='tweet']"));
            const match = articles.find(article => isReplyByUser(article, userName));
            if (match) return true;

            window.scrollBy(0, 600);
            await delay(interval);
        }
        return false;
    }

    async function findCaretWithRetry(article, maxRetries = 5, delayMs = 200) {
        for (let i = 0; i < maxRetries; i++) {
            const caret = article.querySelector("div[aria-label='More']/div > div > div");
            if (caret && isVisible(caret)) return caret;
            await delay(delayMs);
        }
        return null;
    }

    async function tryClickDeleteMenuItem(attempts, baseDelay) {
        for (let i = 0; i < attempts; i++) {
            await delay(baseDelay * (i + 1));
            const menuItems = document.querySelectorAll("[role='menuitem']");
            for (const item of menuItems) {
                const span = item.querySelector("span");
                if (!span) continue;
                const text = span.innerText.toLowerCase();
                if (text.includes("delete")) {
                    span.click();
                    return true;
                }
            }
        }
        return false;
    }

    async function tryConfirmDelete(attempts, baseDelay) {
        for (let i = 0; i < attempts; i++) {
            await delay(baseDelay * (i + 1));
            const confirmBtn = document.querySelector("div[role='dialog'] button[data-testid='confirmationSheetConfirm']");
            if (confirmBtn && isVisible(confirmBtn)) {
                confirmBtn.click();
                return true;
            }
        }
        return false;
    }

    async function clickDeleteOnReply() {
        const articles = Array.from(document.querySelectorAll("article[data-testid='tweet']"));
        const replyArticle = articles.find(article => isReplyByUser(article, userName));
        if (!replyArticle) {
            console.log("[clickDeleteOnReply] No matching reply article found.");
            return false;
        }

        const caret = await findCaretWithRetry(replyArticle);
        if (!caret) {
            console.log("[clickDeleteOnReply] Caret not found in reply article.");
            return false;
        }

        caret.click();
        await delay(waitBetweenDeleteAttempts);

        const deleteClicked = await tryClickDeleteMenuItem(3, waitBetweenDeleteAttempts);
        if (!deleteClicked) {
            console.log("[clickDeleteOnReply] Failed to click delete menu item.");
            return false;
        }

        const confirmed = await tryConfirmDelete(3, waitBetweenDeleteAttempts);
        if (!confirmed) {
            console.log("[clickDeleteOnReply] Failed to confirm deletion.");
            return false;
        }

        return true;
    }

    window.repliesDeletionDone = false;
    window.deletedReplies = 0;

    while (true) {
        const found = await waitForReplyCaret(7000, 200);
        if (!found) {
            console.log("[DeleteAllReplies] No more visible replies.");
            break;
        }

        const deleted = await clickDeleteOnReply();
        if (!deleted) {
            console.log("[DeleteAllReplies] Failed to delete a reply. Stopping.");
            break;
        }

        window.deletedReplies++;
        console.log(`[DeleteAllReplies] Deleted reply #${window.deletedReplies}`);
        await delay(waitAfterDelete);
    }

    window.repliesDeletionDone = true;
    console.log(`[DeleteAllReplies] Finished. Total deleted replies: ${window.deletedReplies}`);
}
