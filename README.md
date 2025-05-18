![Banner](./src/UI/Assets/banner.png)


[![Windows](https://img.shields.io/badge/platform-Windows-blue)](#)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=thorstenalpers_CleanMyPosts&metric=alert_status)](https://sonarcloud.io/project/issues?issueStatuses=OPEN%2CCONFIRMED&id=thorstenalpers_CleanMyPosts)
[![CI Tests](https://github.com/thorstenalpers/CleanMyPosts/actions/workflows/ci.yml/badge.svg)](https://github.com/thorstenalpers/CleanMyPosts/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/thorstenalpers/CleanMyPosts/badge.svg?branch=develop)](https://coveralls.io/github/thorstenalpers/CleanMyPosts?branch=develop)
[![Star this repo](https://img.shields.io/github/stars/thorstenalpers/CleanMyPosts.svg?style=social&label=Star&maxAge=60)](https://github.com/thorstenalpers/CleanMyPosts)


> ⚠️ **Warning:** Development in progress – the application has not been released.


## TODO
* Confirm dialog before deletion
* delete all tweets
* delete all starred tweets
* delete all followed persons
* hide button bar, hideable via settings
* unit tests, coverage > 80%
* integration tests
    * create 10000 tweets and delete them
* docu
* pipeline
  * code coverage 
  * create exe in pipeline
  * run nightly integration tests
* multilingual
* bookmark bar, hideable via settings


---

**CleanMyPosts** is a lightweight Windows desktop application that securely deletes all tweets from your X (formerly Twitter) account in bulk. Designed for privacy-focused users, social media managers, or anyone looking to start fresh.

---

## 🚀 Features

- Delete **all tweets** with one click
- Secure OAuth login via X (Twitter)
- Progress tracking and real-time status
- Option to **skip pinned or recent tweets**
- All operations run **locally** — no data is stored remotely

---

## 🛠️ Requirements

- Windows 10 or later  
- X (Twitter) Developer API credentials (Bearer Token or OAuth Keys)

---

## 📦 Installation

1. Download the latest release from the [Releases](https://github.com/thorstenalpers/x-tweet-cleaner/releases) section.
2. Run the installer and follow the prompts.
3. Launch the app and authenticate with your X (Twitter) account.
4. Start the deletion process of posts, starred and following.

