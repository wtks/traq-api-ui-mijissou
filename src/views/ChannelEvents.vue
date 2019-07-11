<template lang="pug">
  q-page.q-pa-md.q-gutter-sm
    | traQ-UI実装期待
    q-input(v-model="channelId" label="チャンネルUUID")
    div(style="max-height: 80vh; overflow: auto;" id="events-container")
      q-infinite-scroll(ref="scroller" @load="onLoad" scroll-target="#events-container" :disable="!valid")
        q-timeline(color="secondary")
          q-timeline-entry(
            v-for="event in events"
            :key="event.dateTime"
            :title="event.type"
            :subtitle="dayjs(event.dateTime).format('YY/MM/DD HH:mm:ss')"
            :body="makeBody(event)"
          )
        template(slot="loading")
          div.row.justify-center.q-my-md
            q-spinner-dots(color="primary" size="40px")

</template>

<script>
import { getChannelEvents, getUsers, getChannels } from '../api'
import dayjs from 'dayjs'
import isUUID from 'uuid-validate'

const limitPerRequest = 10

export default {
  name: 'ChannelEvents',
  data: function () {
    return {
      channelId: '',
      events: [],
      users: {},
      channels: {}
    }
  },
  watch: {
    channelId: async function () {
      if (isUUID(this.channelId)) {
        this.events = []
        this.$refs.scroller.reset()
        this.$refs.scroller.resume()
      }
    }
  },
  computed: {
    valid: function () {
      return isUUID(this.channelId)
    }
  },
  async created () {
    this.users = await getUsers()
    this.channels = await getChannels()
  },
  methods: {
    async onLoad (index, done) {
      index--
      try {
        const params = {
          limit: limitPerRequest
        }
        if (index > 0) {
          params.until = this.events[(index * limitPerRequest) - 1].dateTime
        }
        const res = await getChannelEvents(this.channelId, params)
        this.events.push(...res.data)
        done(!res.more)
      } catch (e) {
        console.error(e)
        done(true)
      }
    },
    getUserName (id) {
      const u = this.users[id]
      if (u) {
        return `@${u.name}`
      }
      return '?????'
    },
    getChannelName (id) {
      const c = this.channels[id]
      if (c) {
        return `${c.name}`
      }
      return '?????'
    },
    makeBody (event) {
      const detail = event.detail
      switch (event.type) {
        case 'TopicChanged':
          return `${this.getUserName(detail.userId)}がトピックを\n${detail.before}\nから\n${detail.after}\nに変更しました。`
        case 'SubscribersChanged':
          let message = `${this.getUserName(detail.userId)}が、\n`
          if (detail.on.length > 0) {
            message += `${detail.on.map(id => this.getUserName(id)).join()}の通知をオン\n`
          }
          if (detail.off.length > 0) {
            message += `${detail.off.map(id => this.getUserName(id)).join()}の通知をオフ\n`
          }
          return message + 'にしました。'
        case 'PinAdded':
          return `${this.getUserName(detail.userId)}がメッセージ${detail.messageId}をピン留めしました。`
        case 'PinRemoved':
          return `${this.getUserName(detail.userId)}がメッセージ${detail.messageId}のピンを外しました。`
        case 'NameChanged':
          return `${this.getUserName(detail.userId)}がチャンネル名を${detail.before}から${detail.after}に変更しました。`
        case 'ParentChanged':
          return '未対応イベント'
        case 'VisibilityChanged':
          return `${this.getUserName(detail.userId)}がチャンネルを${detail.visibility ? '表示' : '非表示'}にしました。`
        case 'ForcedNotificationChanged':
          return `${this.getUserName(detail.userId)}がチャンネルを${detail.force ? '強制通知' : '非強制通知'}にしました。`
        case 'ChildCreated':
          return `${this.getUserName(detail.userId)}が子チャンネル${this.getChannelName(detail.channelId)}を作成しました。`
        default:
          return '未対応イベント'
      }
    },
    dayjs
  }
}
</script>
