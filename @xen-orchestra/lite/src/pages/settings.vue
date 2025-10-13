<template>
  <UiHeadBar icon="fa:gear">{{ t('settings') }}</UiHeadBar>
  <UiCard class="settings-page">
    <UiTitle>{{ t('about') }}</UiTitle>
    <VtsColumns class="about-columns">
      <VtsQuickInfoColumn>
        <div class="typo-h5">Xen Orchestra Lite</div>
        <VtsQuickInfoColumn>
          <VtsQuickInfoRow :label="t('version')">
            <template #value>
              {{ `v${xoLiteVersion}` }}
              <code v-if="xoLiteGitHead">{{ `(${xoLiteGitHead.slice(0, 5)})` }}</code>
            </template>
          </VtsQuickInfoRow>
          <!-- #TODO we dont have ofical documentation for xo-lite -->
          <!--
 <VtsQuickInfoRow :label="t('documentation')">
            <template #value>
              <UiLink size="medium" href="https://github.com/vatesfr/xen-orchestra/tree/master/%40xen-orchestra/lite">
                {{ t('documentation-name', { name: 'XO Lite' }) }}
              </UiLink>
            </template>
          </VtsQuickInfoRow>
-->
        </VtsQuickInfoColumn>
      </VtsQuickInfoColumn>
      <VtsQuickInfoColumn>
        <div class="typo-h5">XCP-ng</div>
        <VtsQuickInfoColumn>
          <VtsQuickInfoRow :label="t('version')">
            <template #value>{{ `v${xcpVersion}` }}</template>
          </VtsQuickInfoRow>
        </VtsQuickInfoColumn>
      </VtsQuickInfoColumn>
    </VtsColumns>
    <UiTitle>{{ t('language') }}</UiTitle>
    <!-- for regular spacing using VtsQuickInfoRow even label template is not used for this -->
    <VtsQuickInfoRow>
      <template #label>
        <VtsSelect :id="localeSelectId" icon="fa:earth-americas" accent="brand" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script lang="ts" setup>
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsColumns from '@core/components/columns/VtsColumns.vue'
import VtsQuickInfoColumn from '@core/components/quick-info-column/VtsQuickInfoColumn.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { locales } from '@core/i18n.ts'
import { useFormSelect } from '@core/packages/form-select'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const xoLiteVersion = XO_LITE_VERSION
const xoLiteGitHead = XO_LITE_GIT_HEAD
const { t, locale, availableLocales } = useI18n()

usePageTitleStore().setTitle(() => t('settings'))

const { pool } = usePoolStore().subscribe()

const { getByOpaqueRef: getHost } = useHostStore().subscribe()

const poolMaster = computed(() => (pool.value ? getHost(pool.value.master) : undefined))
const xcpVersion = computed(() => poolMaster.value?.software_version.product_version)

watch(locale, newLocale => localStorage.setItem('lang', newLocale))

const limitLocales = availableLocales.filter(locale =>
  ["en", "es"].includes(locale)
);

const { id: localeSelectId } = useFormSelect(limitLocales, {
  model: locale,
  option: {
    label: locale => locales[locale]?.name ?? locale,
  },
})
</script>

<style lang="postcss" scoped>
.settings-page {
  margin: 0.8rem;

  .about-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
    gap: 2.4rem;
  }

  .options {
    display: flex;
    gap: 25px;

    .option {
      display: flex;
      flex-direction: column;
      gap: 1.6em;

      &.selected {
        color: var(--color-brand-txt-base);

        img {
          outline: solid 2px var(--color-brand-txt-base);
        }
      }

      &:not(.selected) {
        cursor: pointer;
      }

      img {
        box-shadow: var(--shadow-100);
        border-radius: 8px;
      }
    }
  }
}
</style>
