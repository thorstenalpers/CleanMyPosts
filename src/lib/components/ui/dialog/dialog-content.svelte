<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { getPortalTarget } from '$lib/portal-context';

	let {
		class: className,
		children,
		...rest
	}: DialogPrimitive.ContentProps & { children?: Snippet } = $props();

	const portalTarget = getPortalTarget();
</script>

<DialogPrimitive.Portal to={portalTarget}>
	<DialogPrimitive.Overlay
		class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
	/>
	<DialogPrimitive.Content
		class={cn(
			'fixed top-1/2 left-1/2 z-50 grid max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border bg-background p-6 shadow-lg',
			className
		)}
		{...rest}
	>
		{@render children?.()}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
