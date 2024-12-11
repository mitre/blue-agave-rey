import App from './App.vue'
import store from './store'
import { createApp } from 'vue'
import "@/assets/fonts/inter.css"
import "@/assets/fonts/barlow.css"
import "@/assets/fonts/roboto_mono.css"
import lunr from 'lunr'

// Configure Lunr
lunr.tokenizer.separator = /[\s]+/;

// Configure app
createApp(App).use(store).mount('#app')
