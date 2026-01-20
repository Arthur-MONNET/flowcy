import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'leaflet/dist/leaflet.css';
import './assets/styles.css';
import App from './App.vue';
import { useI18nStore } from './stores/i18nStore';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

const i18nStore = useI18nStore();
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18nStore.currentLanguage;
  i18nStore.$subscribe((_mutation, state) => {
    document.documentElement.lang = state.currentLanguage;
  });
}
app.mount('#app');
