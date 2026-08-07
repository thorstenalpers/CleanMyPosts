fn main() {
    println!("cargo:rustc-env=CMP_BUILD_DATE={}", build_date());
    tauri_build::build()
}

/// The day the binary was compiled, as `YYYY-MM-DD`.
///
/// A copy of `civil_from_days` rather than a call into `crate::log`: a build script is its own
/// crate and cannot see the one it builds. Cargo caches this, so a local incremental build can
/// carry an older date than today — a release is always built from a cold checkout, which is
/// the only build whose date is ever shown.
fn build_date() -> String {
    let days = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
        / 86_400;

    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };

    format!("{:04}-{m:02}-{d:02}", if m <= 2 { y + 1 } else { y })
}
