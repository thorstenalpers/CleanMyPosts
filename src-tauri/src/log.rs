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

pub fn now_rfc3339() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    // Deliberately not pulling in `chrono` for one timestamp: the UI only ever parses
    // this back with `new Date(...)`, and epoch-millis-to-RFC3339 is a fixed conversion.
    let secs = now.as_secs() as i64;
    let millis = now.subsec_millis();
    let days = secs.div_euclid(86_400);
    let tod = secs.rem_euclid(86_400);
    let (y, m, d) = civil_from_days(days);
    format!(
        "{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}.{millis:03}Z",
        tod / 3600,
        (tod % 3600) / 60,
        tod % 60
    )
}

/// Howard Hinnant's civil-from-days algorithm.
fn civil_from_days(z: i64) -> (i64, u32, u32) {
    let z = z + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    (if m <= 2 { y + 1 } else { y }, m, d)
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

        let messages: Vec<_> = buffer.snapshot().into_iter().map(|e| e.message).collect();
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
        assert_eq!(snapshot.last().unwrap().message, (CAPACITY + 9).to_string());
    }

    #[test]
    fn converts_days_since_epoch_to_a_civil_date() {
        assert_eq!(civil_from_days(0), (1970, 1, 1));
        assert_eq!(civil_from_days(11_323), (2001, 1, 1));
        assert_eq!(civil_from_days(19_358), (2023, 1, 1));
    }

    /// The UI parses this with `z.iso.datetime({ offset: true })`.
    #[test]
    fn timestamp_is_rfc3339_with_a_zulu_offset() {
        let stamp = now_rfc3339();

        assert_eq!(stamp.len(), 24, "unexpected shape: {stamp}");
        assert!(stamp.ends_with('Z'), "no offset: {stamp}");
        assert_eq!(&stamp[4..5], "-");
        assert_eq!(&stamp[10..11], "T");
    }
}
