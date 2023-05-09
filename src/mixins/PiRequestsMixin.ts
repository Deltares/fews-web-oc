import { Vue, Component } from 'vue-property-decorator'


@Component({})
export default class PiRequestsMixin extends Vue {

  async transformRequest(request: Request): Promise<Request> {
    if (!this.$config.authenticationIsEnabled) return request
    // $auth only exists if authentication is enabled.
    const newRequest = await this.$auth.transformRequestAuth(request)
    return newRequest
  }
}
