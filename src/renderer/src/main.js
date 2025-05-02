import './assets/base.scss'
import './assets/icon/iconfont.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// import './utils/fontawesome'

const app = createApp(App)
app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app')
