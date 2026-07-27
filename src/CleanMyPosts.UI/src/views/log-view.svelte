<script lang="ts">
  import { createTable, getCoreRowModel, getSortedRowModel, type ColumnDef, type SortingState, type TableOptionsResolved } from '@tanstack/table-core';
  import type { LogStore } from '$lib/stores/log.svelte';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '$lib/components/ui/table';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import type { LogEntry, LogLevel } from '$lib/bridge/contract';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  interface Props {
    logStore: LogStore;
  }

  let { logStore }: Props = $props();

  let sorting = $state<SortingState>([{ id: 'timestamp', desc: true }]);
  let messageFilter = $state('');
  let levelFilter = $state<LogLevel | 'all'>('all');

  const columns: ColumnDef<LogEntry>[] = [
    { accessorKey: 'timestamp', header: 'Time' },
    { accessorKey: 'level', header: 'Level' },
    { accessorKey: 'message', header: 'Message' }
  ];

  const filteredEntries = $derived(
    logStore.entries.filter(
      (entry) =>
        (levelFilter === 'all' || entry.level === levelFilter) &&
        (messageFilter === '' || entry.message.toLowerCase().includes(messageFilter.toLowerCase()))
    )
  );

  // `@tanstack/svelte-table` (the official adapter) only supports Svelte 5 in an
  // unstable v9 beta, so this rebuilds a fresh `table-core` instance inside a
  // `$derived.by` whenever its inputs change — table-core itself is a plain
  // imperative object, not a Svelte signal, so a long-lived mutable instance
  // would never trigger the template to re-render.
  //
  // `table.getState()` returns `options.state` verbatim (it is *not* merged
  // with `table.initialState`), so every feature's state slice — not just
  // `sorting` — has to be present or `getHeaderGroups()` throws reading e.g.
  // `columnPinning.left`. Constructing once to capture `initialState`, then
  // layering `sorting` on top via `setOptions`, keeps every other slice at
  // table-core's own defaults.
  const table = $derived.by(() => {
    const instance = createTable({
      data: filteredEntries,
      columns,
      state: {},
      onStateChange: () => {},
      onSortingChange: (updater) => {
        sorting = typeof updater === 'function' ? updater(sorting) : updater;
      },
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      renderFallbackValue: null,
      mergeOptions: (defaultOptions, patch) => ({ ...defaultOptions, ...patch })
    } as TableOptionsResolved<LogEntry>);

    instance.setOptions((prev) => ({ ...prev, state: { ...instance.initialState, ...prev.state, sorting } }));
    return instance;
  });

  function formatCell(columnId: string, value: unknown): string {
    if (columnId === 'timestamp') {
      return new Date(value as string).toLocaleTimeString();
    }
    return String(value);
  }
</script>

<div class="flex h-full flex-col gap-2 p-2">
  <div class="flex items-center gap-2">
    <Input placeholder="Filter messages…" bind:value={messageFilter} class="max-w-xs" />
    <div class="flex gap-1">
      {#each [{ value: 'all' as const, label: 'All' }, { value: 'info' as const, label: 'Info' }, { value: 'warning' as const, label: 'Warning' }, { value: 'error' as const, label: 'Error' }] as level (level.value)}
        <Button
          variant={levelFilter === level.value ? 'secondary' : 'ghost'}
          size="sm"
          onclick={() => (levelFilter = level.value)}
        >
          {level.label}
        </Button>
      {/each}
    </div>
    <Button variant="outline" size="sm" onclick={() => logStore.clear()}>
      <Trash2Icon />
      Clear
    </Button>
  </div>

  <div class="flex-1 overflow-auto rounded-md border">
    <Table>
      <TableHeader>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <TableRow>
            {#each headerGroup.headers as header (header.id)}
              <TableHead>
                <button class="flex items-center gap-1 font-medium" onclick={header.column.getToggleSortingHandler()}>
                  {header.column.columnDef.header as string}
                  <ChevronsUpDownIcon class="size-3" />
                </button>
              </TableHead>
            {/each}
          </TableRow>
        {/each}
      </TableHeader>
      <TableBody>
        {#each table.getRowModel().rows as row (row.id)}
          <TableRow>
            {#each row.getVisibleCells() as cell (cell.id)}
              <TableCell class={cell.column.id === 'message' ? 'max-w-md truncate' : ''}>
                {formatCell(cell.column.id, cell.getValue())}
              </TableCell>
            {/each}
          </TableRow>
        {:else}
          <TableRow>
            <TableCell colspan={columns.length} class="text-muted-foreground text-center">No log entries.</TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</div>
