import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BridgeMethods } from './contract';

/**
 * The one gate over the seam that nothing else watches.
 *
 * `BridgeMethods` and the `match` in `src-tauri/src/commands/mod.rs` are two hand-kept lists
 * of the same thing, in two languages, checked by neither compiler. A method added to only
 * one of them fails at runtime — the UI calls it and the host answers "unknown bridge
 * method" — which is the kind of break that reaches a user rather than a build.
 *
 * The C# host had this check; the Rust one lost it in the port.
 */
const DISPATCH = 'src-tauri/src/commands/mod.rs';

function dispatchArms(): string[] {
	const source = readFileSync(DISPATCH, 'utf8');
	const body = source.slice(source.indexOf('match method.as_str()'));
	return [...body.matchAll(/^\s*"([^"]+)"\s*=>/gm)].map(([, method]) => method ?? '');
}

describe('the bridge contract and the host dispatch', () => {
	it('name the same methods', () => {
		expect([...dispatchArms()].sort()).toEqual(Object.keys(BridgeMethods).sort());
	});

	it('dispatches each method exactly once', () => {
		const arms = dispatchArms();
		expect(arms).toEqual([...new Set(arms)]);
	});
});
