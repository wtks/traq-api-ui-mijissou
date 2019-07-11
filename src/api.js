import axios from 'axios'
import { Apis } from 'traq-api'
import randomize from 'randomatic'
import pkce from 'pkce-challenge'

let client = new Apis()
const clientId = process.env.VUE_APP_API_CLIENT_ID || 'lkElAHAUIqFmImUvxmWItnbWO7EBdxttwBaW'

export const baseURL = process.env.VUE_APP_API_ENDPOINT || 'https://traq-dev.tokyotech.org/api/1.0'
axios.defaults.baseURL = baseURL

export function setAuthToken (token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    client = new Apis({
      accessToken: token,
      basePath: baseURL
    })
  } else {
    delete axios.defaults.headers.common['Authorization']
    client = new Apis()
  }
}

export async function redirectAuthorizationEndpoint () {
  // noinspection JSCheckFunctionSignatures
  const state = randomize('Aa0', 10)
  const codeVerifier = pkce.generateVerifier(43)
  const codeChallenge = pkce.generateChallenge(codeVerifier)

  sessionStorage.setItem(`login-code-verifier-${state}`, codeVerifier)

  const authorizationEndpointUrl = new URL(`${baseURL}/oauth2/authorize`)
  // noinspection JSValidateTypes
  authorizationEndpointUrl.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state
  })
  window.location.assign(authorizationEndpointUrl)
}

export function fetchAuthToken (code, verifier) {
  return axios.post(`/oauth2/token`, new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code_verifier: verifier,
    code
  }))
}

export function revokeAuthToken (token) {
  return axios.post(`/oauth2/revoke`, new URLSearchParams({ token }))
}

export async function getMe () {
  const { data } = await client.usersMeGet()
  return data
}

export async function getUsers () {
  const { data } = await client.usersGet()
  const result = {}
  for (let datum of data) {
    result[datum.userId] = datum
  }
  return result
}

export async function getChannels () {
  const { data } = await client.channelsGet()
  const result = {}
  for (let datum of data) {
    result[datum.channelId] = datum
  }
  return result
}

export async function getChannelEvents (channelId, params) {
  const res = await axios.get(`/channels/${channelId}/events`, { params })
  return {
    more: res.headers['x-traq-more'] === 'true',
    data: res.data
  }
}
