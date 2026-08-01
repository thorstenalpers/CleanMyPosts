<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  export const badgeVariants = tv({
    base: 'inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
    variants: {
      variant: {
        neutral: 'border-border text-muted-foreground',
        accent: 'border-primary/40 text-primary',
        destructive: 'border-destructive/40 text-destructive'
      }
    },
    defaultVariants: { variant: 'neutral' }
  });

  export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  interface Props {
    variant?: BadgeVariant;
    class?: string;
    children: Snippet;
  }

  let { variant = 'neutral', class: className, children }: Props = $props();
</script>

<span class={cn(badgeVariants({ variant }), className)}>
  {@render children()}
</span>
