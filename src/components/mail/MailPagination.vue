<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import type { PaginationInfo } from '@/types/mail'

const props = withDefaults(
  defineProps<{
    pagination?: PaginationInfo
    loading?: boolean
  }>(),
  {
    pagination: () => ({ page: 1, perPage: 10, total: 0, totalPages: 1 }),
    loading: false,
  }
)

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'per-page-change', perPage: number): void
}>()

const pageRangeStart = computed(() => {
  if (!props.pagination.total) return 0
  return (props.pagination.page - 1) * props.pagination.perPage + 1
})

const pageRangeEnd = computed(() => {
  if (!props.pagination.total) return 0
  return Math.min(
    props.pagination.page * props.pagination.perPage,
    props.pagination.total
  )
})

function changePage(page: number) {
  if (page >= 1 && page <= props.pagination.totalPages) {
    emit('page-change', page)
  }
}

function changePerPage(event: Event) {
  const target = event.target as HTMLSelectElement
  const val = parseInt(target.value, 10)
  if (val) {
    emit('per-page-change', val)
  }
}
</script>

<template>
  <div
    v-if="pagination && pagination.total > 0"
    class="flex flex-col sm:flex-row items-center justify-between gap-3 border-t p-3 bg-card/60 text-xs text-muted-foreground"
  >
    <!-- Rows per page selector & status -->
    <div class="flex items-center gap-3">
      <span class="text-xs">Rows per page:</span>
      <select
        :value="pagination.perPage"
        class="h-8 rounded border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        @change="changePerPage"
      >
        <option :value="5">5</option>
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>

      <span class="hidden sm:inline">
        Showing {{ pageRangeStart }}–{{ pageRangeEnd }} of {{ pagination.total }} items
      </span>
    </div>

    <!-- Page navigation buttons -->
    <div class="flex items-center gap-1.5">
      <span class="mr-2 font-medium text-foreground">
        Page {{ pagination.page }} of {{ pagination.totalPages }}
      </span>

      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        :disabled="pagination.page <= 1 || loading"
        @click="changePage(1)"
        title="First Page"
      >
        <ChevronsLeft class="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        :disabled="pagination.page <= 1 || loading"
        @click="changePage(pagination.page - 1)"
        title="Previous Page"
      >
        <ChevronLeft class="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        :disabled="pagination.page >= pagination.totalPages || loading"
        @click="changePage(pagination.page + 1)"
        title="Next Page"
      >
        <ChevronRight class="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8"
        :disabled="pagination.page >= pagination.totalPages || loading"
        @click="changePage(pagination.totalPages)"
        title="Last Page"
      >
        <ChevronsRight class="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
</template>
