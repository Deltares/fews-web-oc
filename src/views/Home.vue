<template>
  <div>
    What a lovely homepage
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
// import Oidc from 'oidc-client'

@Component
export default class Home extends Vue {
  mounted (): void {
    // console.log('mounted', window)
    // const store = new Oidc.WebStorageStateStore({ store: window.localStorage })
    // new Oidc.UserManager({ userStore: store })
    //   .signinRedirectCallback()
    //   .then(user => (window.location = user.state))
    //   .catch(err => console.error(err))

    // fetch('https://graph.microsoft.com/oidc/userinfo')
    //   .then(res => res.json())
    //   .then(response => {
    //     console.log(response)
    //   })
  }
}
</script>
