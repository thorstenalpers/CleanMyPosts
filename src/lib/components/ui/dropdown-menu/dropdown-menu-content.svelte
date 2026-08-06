<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import DropdownMenuPortal from './dropdown-menu-portal.svelte';

	let {
		ref = $bindable(null),
		sideOffset = 4,
		align = 'start',
		class: className,
		...restProps
	}: DropdownMenuPrimitive.ContentProps = $props();
</script>

<DropdownMenuPortal>
	<DropdownMenuPrimitive.Content
		bind:ref
		data-slot="dropdown-menu-content"
		{sideOffset}
		{align}
		class={cn(
			'z-50 max-h-80 min-w-32 overflow-x-hidden overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md outline-none',
			className
		)}
		{...restProps}
	/>
</DropdownMenuPortal>
