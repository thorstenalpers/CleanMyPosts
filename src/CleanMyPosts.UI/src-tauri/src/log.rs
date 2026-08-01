use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::Mutex;

/// Matches `LogEntrySchema`; `timestamp` is an RFC 3339 string with offset.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
}

const CAPACITY: usize = 2000;

/// Bounded so a long run cannot grow the buffer without limit; the log view is a
/// diagnostic tail, not an audit trail.
pub struct LogBuffer {
    entries: Mutex<VecDeque<LogEntry>>,
}

impl LogBuffer {
    pub fn new() -> Self {
        Self {
            entries: Mutex::new(VecDeque::with_capacity(CAPACITY)),
        }
    }

    pub fn push(&self, entry: LogEntry) {
        let mut entries = self.entries.lock().expect("log mutex");
        if entries.len() == CAPACITY {
            entries.pop_front();
        }
        entries.push_back(entry);
    }

    pub fn snapshot(&self) -> Vec<LogEntry> {
        self.entries
            .lock()
            .expect("log mutex")
            .iter()
            .cloned()
            .collect()
    }
}

impl Default for LogBuffer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(message: &str) -> LogEntry {
        LogEntry {
            timestamp: "2026-08-01T00:00:00.000Z".into(),
            level: "info".into(),
            message: message.into(),
        }
    }

    #[test]
    fn snapshot_preserves_insertion_order() {
        let buffer = LogBuffer::new();
        buffer.push(entry("first"));
        buffer.push(entry("second"));

        let messages: Vec<_> = buffer
            .snapshot()
            .into_iter()
            .map(|e| e.message)
            .collect();
        assert_eq!(messages, ["first", "second"]);
    }

    #[test]
    fn drops_oldest_once_full() {
        let buffer = LogBuffer::new();
        for i in 0..CAPACITY + 10 {
            buffer.push(entry(&i.to_string()));
        }

        let snapshot = buffer.snapshot();
        assert_eq!(snapshot.len(), CAPACITY);
        assert_eq!(snapshot.first().unwrap().message, "10");
        assert_eq!(
            snapshot.last().unwrap().message,
            (CAPACITY + 9).to_string()
        );
    }
}
