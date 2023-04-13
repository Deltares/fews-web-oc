import { Vue, Component } from 'vue-property-decorator'


@Component({})
export default class PiRequestsMixin extends Vue {

  async transformRequest(request: Request): Promise<Request> {
    if (!this.$config.authenticationIsEnabled) return request
    // $auth only exists if authentication is enabled.
    const requestAuthHeaders = await this.$auth.getAuthorizationHeaders()
    const requestInit = { headers: requestAuthHeaders}
    const newRequest = new Request(request, requestInit)
    return newRequest
  }
}
