import type { RunParams } from './protocol';

export interface DeleteActionDefinition {
	/** True when there is nothing left to delete on the current page. */
	isEmpty(): boolean;
	/** Runs the full click/confirm/retry loop for one page load, returns the count deleted. */
	run(params: RunParams): Promise<number>;
}
