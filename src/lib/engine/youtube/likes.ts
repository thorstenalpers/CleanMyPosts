import { clickWithCursor, delay, highlightElement, postLog, postProgress, waitForByScrolling } from '../dom';
import type { RunParams } from '../protocol';
import type { DeleteActionDefinition } from '../types';

/** Multilingual fragments of "Remove from Liked videos" menu items. */
const REMOVE_PATTERNS = [
  'remove from liked',
  'remove from "liked',
  'aus "videos, die ich mag" entfernen',
  'videos, die ich mag',
  'entfernen',
  'supprimer de',
  "j'aime",
  'retirer de',
  'eliminar de',
  'me gusta',
  'quitar de',
  'rimuovi da',
  'mi piace',
  'remover de',
  'gostei',
  'verwijderen uit',
  'usuń z',
  'удалить из'
];

function matchesRemovePattern(text: string): boolean {
  const lower = text.toLowerCase();
  return REMOVE_PATTERNS.some((pattern) => lower.includes(pattern));
}

type VideoItemType = 'playlist' | 'rich' | 'compact';
interface VideoItem {
  element: HTMLElement;
  type: VideoItemType;
}

function findVideoItem(): VideoItem | null {
  const playlist = document.querySelector<HTMLElement>('ytd-playlist-video-renderer:not([is-dismissed])');
  if (playlist) return { element: playlist, type: 'playlist' };

  const rich = document.querySelector<HTMLElement>('ytd-rich-item-renderer:not([is-dismissed])');
  if (rich) return { element: rich, type: 'rich' };

  const compact = document.querySelector<HTMLElement>('ytd-compact-video-renderer:not([is-dismissed])');
  if (compact) return { element: compact, type: 'compact' };

  return null;
}

/** A Google feedback/survey dialog can pop up mid-run and, being modal, blocks the next click. */
function dismissSurveyBanner(): void {
  const closeBtn = document.querySelector<HTMLElement>('button[aria-label="Close this dialog"]');
  if (closeBtn && closeBtn.getBoundingClientRect().width > 0) {
    clickWithCursor(closeBtn);
  }
}

function findMenuButton(videoItem: HTMLElement, itemType: VideoItemType): HTMLElement | null {
  let menuButton: HTMLElement | null = null;

  if (itemType === 'playlist') {
    const menuRenderer = videoItem.querySelector('ytd-menu-renderer');
    menuButton =
      menuRenderer?.querySelector('yt-icon-button#button button') ??
      menuRenderer?.querySelector('button#button') ??
      menuRenderer?.querySelector('button') ??
      null;
  } else {
    menuButton =
      videoItem.querySelector('button[aria-label*="ction"]') ??
      videoItem.querySelector('button[aria-label*="menu"]') ??
      videoItem.querySelector('button[aria-label*="Menu"]') ??
      videoItem.querySelector('button[aria-label*="Mehr"]') ??
      videoItem.querySelector('button[aria-label*="More"]') ??
      videoItem.querySelector('button[aria-label*="plus"]') ??
      videoItem.querySelector('button[aria-label*="más"]') ??
      videoItem.querySelector('.shortsLockupViewModelHostOutsideMetadataMenu button') ??
      videoItem.querySelector('ytd-menu-renderer button');
  }

  return menuButton ?? videoItem.querySelector('button[aria-label]');
}

async function clickMenuButton(videoItem: HTMLElement, itemType: VideoItemType, waitTime: number): Promise<boolean> {
  const menuButton = findMenuButton(videoItem, itemType);
  if (!menuButton) return false;

  clickWithCursor(menuButton);
  await delay(waitTime);
  return true;
}

function findRemoveMatch(container: ParentElement, itemSelector: string, textSelectors: string[]): HTMLElement | null {
  for (const item of container.querySelectorAll<HTMLElement>(itemSelector)) {
    const textEl = textSelectors.map((s) => item.querySelector(s)).find((el) => el !== null);
    const text = textEl?.textContent ?? item.textContent ?? '';
    if (matchesRemovePattern(text)) return item;
  }
  return null;
}

type ParentElement = Document | Element;

async function clickRemoveFromLiked(): Promise<boolean> {
  const delays = [200, 300, 400, 500, 600, 800, 1000, 1500];

  for (const ms of delays) {
    await delay(ms);

    const shortsPopup = document.querySelector('.ytContextualSheetLayoutContentContainer') ?? document.querySelector('yt-list-view-model');
    if (shortsPopup) {
      const match = findRemoveMatch(shortsPopup, 'yt-list-item-view-model', [
        '.yt-list-item-view-model__title',
        '.yt-core-attributed-string',
        '[role="text"]'
      ]);
      if (match) {
        const target =
          match.querySelector<HTMLElement>('.yt-list-item-view-model__container') ?? match.querySelector('div') ?? match;
        clickWithCursor(target);
        return true;
      }
    }

    const popup = document.querySelector('ytd-menu-popup-renderer');
    if (popup) {
      const match = findRemoveMatch(popup, 'ytd-menu-service-item-renderer', ['yt-formatted-string']);
      if (match) {
        const target = match.querySelector<HTMLElement>('tp-yt-paper-item') ?? match;
        clickWithCursor(target);
        return true;
      }
    }

    const anyPopup = document.querySelector('[role="listbox"], [role="menu"]');
    if (anyPopup) {
      const match = findRemoveMatch(anyPopup, '[role="menuitem"], [role="option"]', []);
      if (match) {
        clickWithCursor(match);
        return true;
      }
    }
  }

  return false;
}

async function closeMenu(): Promise<void> {
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
  await delay(200);
}

async function unlikeVideo(waitTime: number): Promise<boolean> {
  const result = findVideoItem();
  if (!result) return false;

  highlightElement(result.element);
  if (!(await clickMenuButton(result.element, result.type, waitTime))) return false;

  if (!(await clickRemoveFromLiked())) {
    await closeMenu();
    return false;
  }

  await delay(500);

  const waitDelays = [200, 300, 500, 700, 1000, 1500];
  for (const ms of waitDelays) {
    await delay(ms);
    if (result.element.hasAttribute('is-dismissed')) return true;
    if (!document.contains(result.element)) return true;
    if (result.element.hasAttribute('hidden')) return true;
  }

  return true;
}

export const youTubeLikesAction: DeleteActionDefinition = {
  isEmpty(): boolean {
    return document.querySelector('ytd-playlist-video-renderer') === null;
  },

  async run(params: RunParams): Promise<number> {
    let deletedCount = 0;
    let failures = 0;
    const maxFailures = 3;

    while (failures < maxFailures) {
      dismissSurveyBanner();

      const found = await waitForByScrolling(() => findVideoItem() !== null, 400, { maxWaitMs: 5000, intervalMs: 300 });
      if (!found) {
        failures++;
        const prevScroll = window.scrollY;
        window.scrollBy(0, 500);
        await delay(500);

        if (window.scrollY === prevScroll) {
          postLog('info', 'No scroll change; assuming no more videos.');
          break;
        }
        continue;
      }

      const success = await unlikeVideo(params.waitBetweenRetryDeleteAttempts);
      if (success) {
        deletedCount++;
        postProgress(params.requestId, deletedCount);
        failures = 0;
        await delay(params.waitAfterDelete);
      } else {
        failures++;
        await closeMenu();
        await delay(500);
      }
    }

    return deletedCount;
  }
};
