import Vue from 'vue'
import Router from 'vue-router'
import store from './store'
import { fetchAuthToken, redirectAuthorizationEndpoint, setAuthToken } from './api'

Vue.use(Router)

setAuthToken(store.state.authToken)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: () => import('./layouts/Default'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('./views/Home')
        },
        {
          path: 'channel-events',
          name: 'channel-events',
          component: () => import('./views/ChannelEvents')
        }
      ],
      beforeEnter: async (to, from, next) => {
        try {
          await store.dispatch('fetchUserInfo')
          next()
        } catch (e) {
          await redirectAuthorizationEndpoint()
        }
      }
    },
    {
      path: '/callback',
      name: 'callback',
      component: () => import('./views/Callback'),
      beforeEnter: async (to, from, next) => {
        const code = to.query.code
        const state = to.query.state
        const codeVerifier = sessionStorage.getItem(`login-code-verifier-${state}`)
        if (!code || !codeVerifier) {
          next('/')
        }

        try {
          const res = await fetchAuthToken(code, codeVerifier)
          store.commit('setToken', res.data.access_token)
          next('/')
        } catch (e) {
          console.error(e)
        }
      }
    }
  ]
})
