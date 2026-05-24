<script setup>
/**
 * PcFooter — 4 列 footer + brand 区 + bottom strip
 *
 * Spec: docs/design/specs/p3.2-pc-home.md §1.8
 * Anchor: cd-3-desktop.html line 1248-1320, 2247-2320
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  brand: { type: Object, required: true },
  columns: { type: Array, required: true },
  social: { type: Array, default: () => [] },
  bottom: { type: Object, required: true },
})

const emit = defineEmits(['link-click', 'social-click', 'logo-click'])

const socialIconPaths = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
  x: '<path fill="currentColor" d="M18.2 3H21l-6.5 7.4L22 21h-6l-4.7-6L6 21H3.2l7-8L2 3h6.1l4.3 5.7L18.2 3zm-1 16.4h1.6L7 4.5H5.3l11.9 14.9z"/>',
  discord: '<path fill="currentColor" d="M19.6 4.3a17.9 17.9 0 0 0-4.5-1.4l-.2.4a16 16 0 0 0-1 .1 12.7 12.7 0 0 0-4 0c-.2-.2-.6-.4-1-.5L8.7 3a17.7 17.7 0 0 0-4.5 1.4C1.5 8.5.8 12.5 1.1 16.4a18 18 0 0 0 5.5 2.8c.4-.6.8-1.2 1-1.9-.6-.2-1.3-.5-1.9-.9.2-.1.3-.2.5-.4a13 13 0 0 0 11.4 0c.2.2.3.3.5.4-.6.4-1.3.7-1.9.9.3.7.7 1.3 1 1.9a18 18 0 0 0 5.5-2.8c.4-4.7-.6-8.6-3.1-12.1zM8.5 14.2c-1 0-1.9-1-1.9-2.2 0-1.2.9-2.2 1.9-2.2s1.9 1 1.9 2.2c0 1.2-.9 2.2-1.9 2.2zm7 0c-1 0-1.9-1-1.9-2.2 0-1.2.9-2.2 1.9-2.2s1.9 1 1.9 2.2c0 1.2-.9 2.2-1.9 2.2z"/>',
  github: '<path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.5-1.1-1.5-1-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 1 1.6 2.5 1.1 3.1.9.1-.7.4-1.2.7-1.5-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/>',
}

const getSocialPath = (id) => socialIconPaths[id] || ''

const onLink = (link, e) => {
  e.preventDefault()
  emit('link-click', link)
}
const onSocial = (s, e) => {
  e.preventDefault()
  emit('social-click', s)
}
const onLogo = (e) => {
  e.preventDefault()
  emit('logo-click', e)
}
</script>

<template>
  <footer class="pc-footer">
    <div class="pc-footer__inner">
      <div class="pc-footer__brand">
        <a class="pc-footer__wm" href="#" @click="onLogo">
          {{ brand.wordmark.left }}
          <span class="pc-footer__wm-div">{{ brand.wordmark.divider }}</span>
          {{ brand.wordmark.right }}
          <span class="pc-footer__wm-tag">{{ brand.wordmark.tag }}</span>
        </a>
        <p class="pc-footer__tagline">{{ t('common.footer.tagline') }}</p>
        <div class="pc-footer__meta">
          {{ brand.build }} · {{ brand.buildLocations }}<br/>
          {{ t('common.footer.statusLabel') }} <b>{{ brand.status }}</b> · {{ t('common.footer.uptimeLabel') }} <b>{{ brand.uptime }}</b>
        </div>
        <div class="pc-footer__social">
          <a
            v-for="s in social"
            :key="s.id"
            class="pc-footer__social-ico"
            href="#"
            :aria-label="s.label"
            @click="onSocial(s, $event)"
          >
            <svg viewBox="0 0 24 24" v-html="getSocialPath(s.id)"></svg>
          </a>
        </div>
      </div>

      <div v-for="col in columns" :key="col.heading" class="pc-footer__col">
        <h4 class="pc-footer__col-h">{{ col.heading }}</h4>
        <ul>
          <li v-for="link in col.links" :key="link.label">
            <a href="#" @click="onLink(link, $event)">{{ link.label }}</a>
          </li>
        </ul>
      </div>
    </div>

    <div class="pc-footer__bottom">
      <div class="pc-footer__bottom-inner">
        <span>{{ bottom.eof }}</span>
        <div class="pc-footer__locale-pick">
          <span>{{ bottom.locale }} · <b>{{ bottom.networkStatus }}</b></span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.pc-footer {
  background: var(--paper);
  border-top: 1.5px solid var(--ink);
  margin-top: 48px;
}
.pc-footer__inner {
  width: 1280px;
  margin: 0 auto;
  padding: 48px 0;
  display: grid;
  grid-template-columns: 380px repeat(4, 1fr);
  gap: 32px;
}
.pc-footer__brand { display: flex; flex-direction: column; gap: 16px; }
.pc-footer__wm {
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-22);
  letter-spacing: -0.01em;
  color: var(--ink);
  text-decoration: none;
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.pc-footer__wm-div { color: var(--ink-3); font-weight: 500; }
.pc-footer__wm-tag {
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
.pc-footer__tagline {
  margin: 0;
  font-family: var(--f-sans);
  font-size: var(--text-14);
  color: var(--ink-2);
  line-height: 1.5;
}
.pc-footer__meta {
  font-family: var(--f-mono);
  font-size: var(--text-10);
  color: var(--ink-2);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.6;
}
.pc-footer__meta b { color: var(--ink); font-weight: 600; }

.pc-footer__social { display: flex; gap: 8px; }
.pc-footer__social-ico {
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--ink);
  background: var(--paper);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  text-decoration: none;
  transition: background-color 120ms ease-out, color 120ms ease-out, box-shadow 120ms ease-out;
}
.pc-footer__social-ico svg { width: 14px; height: 14px; }
.pc-footer__social-ico:hover { background: var(--ink); color: var(--hilite); }
.pc-footer__social-ico:focus-visible { outline: none; box-shadow: var(--glow-accent-ring); }

.pc-footer__col h4.pc-footer__col-h {
  margin: 0 0 12px;
  font-family: var(--f-cond);
  font-weight: 700;
  font-size: var(--text-12);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink);
  padding-bottom: 6px;
  border-bottom: 1.5px solid var(--accent-link);
  display: inline-block;
  min-width: 24px;
}
.pc-footer__col ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pc-footer__col ul li a {
  font-family: var(--f-mono);
  font-size: var(--text-12);
  color: var(--ink-2);
  text-decoration: none;
  transition: color 120ms ease-out;
}
.pc-footer__col ul li a:hover { color: var(--ink); }
.pc-footer__col ul li a:focus-visible { outline: none; color: var(--ink); box-shadow: var(--glow-accent-ring); }

.pc-footer__bottom {
  background: var(--ink);
  color: var(--paper);
  padding: 12px 0;
  border-top: 1.5px solid var(--ink);
}
.pc-footer__bottom-inner {
  width: 1280px;
  margin: 0 auto;
  padding: 0 80px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--f-mono);
  font-size: var(--text-10);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.pc-footer__bottom-inner b { color: var(--hilite); font-weight: 600; }
</style>
