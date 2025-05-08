import { createRouter, createWebHashHistory } from 'vue-router'

import MainCalcul from '../views/MainCalcul.vue'

const router = createRouter({
  mode: 'hash',
  history: createWebHashHistory('/'),
  routes: [
    {
      path: '/',
      redirect: '/main-calcul'
    },
    {
      path: '/main-calcul',
      component: MainCalcul
    }
  ]
})

export default router
