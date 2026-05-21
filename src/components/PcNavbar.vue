<script setup>
/**
 * PcNavbar — 顶部 sticky 导航栏
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.2
 * Anchor: cd-3-desktop.html line 58-237, 1311-1351
 *
 * 装配:
 *  wordmark | nav-links × 4 | nav-search (UiSearchBar with kbd) | locale | bell | upload | avatar
 */
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { computed } from 'vue'
import UiSearchBar from '@/components/ui/UiSearchBar.vue'
import UiIconButton from '@/components/ui/UiIconButton.vue'
import UiAvatar from '@/components/ui/UiAvatar.vue'

const props = defineProps({
  navLinks: { type: Array, required: true },
  brand: { type: Object, required: true },
  search: { type: Object, default: () => ({ label: 'QUERY', placeholder: '', kbd: '⌘ K' }) },
  locale: { type: Object, default: () => ({ display: 'EN · USD' }) },
  bellBadge: { type: [Boolean, Number], default: false },
})

const emit = defineEmits(['logo-click', 'nav-click', 'search', 'locale-click', 'bell-click', 'upload-click', 'avatar-click'])

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchValue = defineModel('searchValue', { type: String, default: '' })

const activeId = computed(() => {
  const link = props.navLinks.find((l) => l.route === route.path)
  return link?.id ?? props.navLinks.find((l) => l.active)?.id
})

const userInitials = computed(() => {
  const name = userStore.userInfo?.nickname || userStore.userInfo?.username || 'YO'
  return name.slice(0, 2).toUpperCase()
})

const onWordmarkClick = (e) => {
  e.preventDefault()
  emit('logo-click', e)
}

const onLinkClick = (link, e) => {
  e.preventDefault()
  emit('nav-click', link)
  if (link.route) router.push(link.route).catch(() => {})
}

const onSearch = (v) => emit('search', v)
const onLocale = () => emit('locale-click')
const onBell = () => emit('bell-click')
const onUpload = () => emit('upload-click')
const onAvatar = () => emit('avatar-click')
</script>

<template>
  <nav class="pc-navbar" role="banner">
    <div class="pc-navbar__inner">
      <div class="pc-navbar__left">
        <a class="pc-navbar__wm" href="#" @click="onWordmarkClick">
          {{ brand.wordmark.left }}
          <span class="pc-navbar__wm-div">{{ brand.wordmark.divider }}</span>
          {{ brand.wordmark.right }}
          <span class="pc-navbar__wm-tag">{{ brand.wordmark.tag }}</span>
        </a>
        <div class="pc-navbar__links">
          <a
            v-for="link in navLinks"
            :key="link.id"
            href="#"
            class="pc-navbar__link"
            :class="{ 'pc-navbar__link--active': link.id === activeId }"
            @click="onLinkClick(link, $event)"
          >
            <span class="pc-navbar__link-ix">{{ link.ix }}</span>
            {{ link.label }}
          </a>
        </div>
      </div>

      <UiSearchBar
        v-model="searchValue"
        :label="search.label"
        :placeholder="search.placeholder"
        :kbd="search.kbd"
        size="md"
        class="pc-navbar__search"
        @submit="onSearch"
      />

      <div class="pc-navbar__right">
        <button class="pc-navbar__locale" type="button" @click="onLocale" :aria-label="`Locale: ${locale.display}`">
          <span class="pc-navbar__flag" aria-hidden="true"></span>
          <span>{{ locale.display }}</span>
        </button>

        <UiIconButton variant="outline" :size="32" :badge="bellBadge" aria-label="Notifications" @click="onBell">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/>
            <path d="M10 19a2 2 0 0 0 4 0"/>
          </svg>
        </UiIconButton>

        <button class="pc-navbar__upload" type="button" @click="onUpload" aria-label="Log a sample">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Log Sample
        </button>

        <button class="pc-navbar__avatar" type="button" @click="onAvatar" aria-label="My profile">
          <UiAvatar :initials="userInitials" :size="32" palette="hilite" shape="square" />
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.pc-navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 56px;
  background: var(--paper);
  border-bottom: 1.5px solid var(--ink);
}
.pc-navbar__inner {
  width: 1280px;
  margin: 0 auto;
  height: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 32px;
}
.pc-navbar__left { display: flex; align-items: center; gap: 24px; }
.pc-navbar__wm {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-22);
  letter-spacing: -0.01em;
  color: var(--ink);
  text-decoration: none;
  display: flex;
  align-items: baseline;
  gap: 6px;
  cursor: pointer;
}
.pc-navbar__wm-div { color: var(--ink-3); font-weight: 500; }
.pc-navbar__wm-tag {
  font-family: var(--f-mono);
  font-size: var(--text-9);
  font-weight: 700;
  color: var(--ink);
  background: var(--hilite);
  padding: 2px 5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transform: translateY(-2px);
}
.pc-navbar__links { display: flex; align-items: center; gap: 4px; }
.pc-navbar__link {
  color: var(--ink-2);
  text-decoration: none;
  font-family: var(--f-mono);
  font-weight: 600;
  font-size: var(--text-11);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 120ms ease-out, background-color 120ms ease-out;
}
.pc-navbar__link-ix {
  font-size: var(--text-9);
  color: var(--ink-3);
  font-weight: 500;
}
.pc-navbar__link:hover { color: var(--ink); }
.pc-navbar__link--active {
  background: var(--ink);
  color: var(--hilite);
}
.pc-navbar__link--active .pc-navbar__link-ix {
  color: var(--paper);
  opacity: 0.5;
}
.pc-navbar__link:focus-visible {
  outline: none;
  box-shadow: var(--glow-accent-ring);
}

.pc-navbar__search { width: 480px; }

.pc-navbar__right { display: flex; align-items: center; gap: 10px; }
.pc-navbar__locale {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ink);
  font-family: var(--f-mono);
  font-size: var(--text-11);
  font-weight: 600;
  padding: 6px 8px;
  border: 1px solid var(--ink);
  background: var(--paper);
  cursor: pointer;
  letter-spacing: 0.06em;
  border-radius: var(--radius-none);
  transition: background-color 120ms ease-out;
}
.pc-navbar__locale:hover { background: var(--paper-3); }
.pc-navbar__locale:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }

.pc-navbar__flag {
  width: 14px;
  height: 10px;
  background:
    linear-gradient(to bottom, #B22234 0, #B22234 8.3%, #FFF 8.3%, #FFF 16.6%, #B22234 16.6%, #B22234 25%, #FFF 25%, #FFF 33.3%, #B22234 33.3%, #B22234 41.6%, #FFF 41.6%, #FFF 50%, #B22234 50%, #B22234 58.3%, #FFF 58.3%, #FFF 66.6%, #B22234 66.6%, #B22234 75%, #FFF 75%, #FFF 83.3%, #B22234 83.3%, #B22234 91.6%, #FFF 91.6%);
  border: 0.5px solid var(--ink);
  flex-shrink: 0;
}

.pc-navbar__upload {
  height: 32px;
  padding: 0 14px;
  background: var(--hilite);
  color: var(--ink);
  border: 1.5px solid var(--ink);
  border-radius: var(--radius-none);
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-13);
  letter-spacing: 0;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  position: relative;
  transition: background-color 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-navbar__upload svg { width: 14px; height: 14px; }
.pc-navbar__upload::before,
.pc-navbar__upload::after {
  content: "";
  position: absolute;
  width: 6px; height: 6px;
  border: 1.5px solid var(--ink);
}
.pc-navbar__upload::before { top: -4px; left: -4px; border-right: 0; border-bottom: 0; }
.pc-navbar__upload::after  { bottom: -4px; right: -4px; border-left: 0; border-top: 0; }
.pc-navbar__upload:hover { box-shadow: var(--glow-accent-sm); }
.pc-navbar__upload:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }

.pc-navbar__avatar {
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-none);
}
.pc-navbar__avatar :deep(.ui-avatar) { border-width: 1.5px; }
.pc-navbar__avatar:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }
</style>
