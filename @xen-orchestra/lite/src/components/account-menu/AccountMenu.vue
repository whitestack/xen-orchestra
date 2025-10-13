<template>
  <MenuList placement="bottom-end">
    <template #trigger="{ open, isOpen }">
      <UiAccountMenuButton
        v-tooltip="isOpen ? false : { content: t('settings'), placement: 'left' }"
        :selected="isOpen"
        size="medium"
        @click="open($event)"
      />
    </template>
    <MenuItem icon="fa:gear" @click="openSettings">{{ t('settings') }}</MenuItem>
    <MenuItem icon="fa:arrow-right-from-bracket" class="menu-item-logout" @click="logout">
      {{ t('log-out') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import { useXenApiStore } from '@/stores/xen-api.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()

const logout = () => {
  const xenApiStore = useXenApiStore()
  xenApiStore.disconnect()
  nextTick(() => router.push({ name: '/' }))
}

const openSettings = () => router.push({ name: '/settings' })
</script>

<style lang="postcss" scoped>
.menu-item-logout {
  color: var(--color-danger-txt-base);
}
</style>
