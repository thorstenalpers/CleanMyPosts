# Product Vision

## What the app is

A lightweight Windows desktop app that bulk-deletes the user's own content on social
platforms by driving an embedded browser with injected JavaScript. The user logs in normally
inside the app; the app then automates the deletion on their behalf.

```
Select platform → Navigate to correct page → Inject script → Delete → Show progress
```

## Features

### X (formerly Twitter)

- View all posts, reposts, replies, likes, and followings
- Bulk delete all posts
- Bulk delete all reposts
- Bulk delete all replies
- Remove all likes
- Unfollow all followings

### YouTube

- View all comments via Google My Activity
- Bulk delete all comments
- View all liked videos
- Remove all liked videos

## User promise

1. **Nothing leaves the machine.** No telemetry, no account with us, no server, no local
   database.
2. **Nothing is faked.** The app clicks what a human would click — just more patiently. Every
   action goes through the platform's own UI.
3. **Honesty about limits.** When a deletion fails, the app says so with a count and a reason
   instead of reporting "done".

## Non-goals

- No reading or scanning content into a local database.
- No analytics or content history views.
- No posting, scheduling, or engagement growth.
- No analysis of other people's accounts — only the signed-in user's own content.
- No cloud sync, no multi-device.
- No bypassing of platform protections. If an action is throttled, the app waits.

## Platforms

| Platform | Show | Delete actions                                    |
|----------|------|---------------------------------------------------|
| X        | ✓    | posts, reposts, replies, likes, following         |
| YouTube  | ✓    | comments (via myactivity.google.com), liked videos|

## Priorities on conflict

1. Privacy — nothing stored locally, nothing sent externally
2. Reliability — the count shown is the count deleted
3. Usability
4. Feature scope

Speed is not on the list. A deletion run that runs overnight beats one that races and
triggers the platform's automation detection.
