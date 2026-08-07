<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { DialogContent } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$lib/i18n/index.svelte';
	import CodeIcon from '@lucide/svelte/icons/code';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';

	interface Props {
		open: boolean;
		script: string;
		onSave: (script: string) => void;
	}

	let { open = $bindable(), script, onSave }: Props = $props();

	// A copy, so closing the dialog throws the edit away rather than half-applying it. Filled
	// on the way in rather than at construction: the dialog outlives every edit of the setting.
	let draft = $state('');

	$effect(() => {
		if (open) draft = script;
	});

	function save(): void {
		onSave(draft);
		open = false;
	}
</script>

<DialogPrimitive.Root bind:open>
	<DialogContent>
		<DialogPrimitive.Title class="flex items-center gap-2 text-lg font-semibold">
			<CodeIcon class="size-4 text-muted-foreground" />
			{t('settings.engine')}
		</DialogPrimitive.Title>
		<DialogPrimitive.Description class="text-sm text-muted-foreground">
			{t('settings.engine.hint')}
		</DialogPrimitive.Description>

		<textarea
			bind:value={draft}
			spellcheck="false"
			aria-label={t('settings.engine')}
			placeholder={t('settings.engine.placeholder')}
			class="h-64 w-full resize-none rounded-md border border-input bg-background p-2.5 font-mono text-xs leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		></textarea>

		<div class="flex justify-end gap-2">
			<Button variant="ghost" size="sm" class="h-8" onclick={() => (draft = '')}>
				<RotateCcwIcon />
				{t('settings.engine.reset')}
			</Button>
			<Button variant="outline" size="sm" class="h-8" onclick={() => (open = false)}>
				{t('confirm.cancel')}
			</Button>
			<Button size="sm" class="h-8" onclick={save}>
				{t('settings.engine.save')}
			</Button>
		</div>
	</DialogContent>
</DialogPrimitive.Root>
