import Vue from 'vue'
import Vuex from 'vuex'
import { setAuthToken, getMe } from './api'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    userInfo: null,
    authToken: null
  },
  mutations: {
    setUserInfo (state, info) {
      state.userInfo = info
    },
    setToken (state, token) {
      state.authToken = token
      setAuthToken(token)
    }
  },
  actions: {
    async fetchUserInfo ({ commit }) {
      const res = await getMe()
      commit('setUserInfo', res.data)
    }
  },
  plugins: [createPersistedState({
    paths: ['authToken']
  })]
})
