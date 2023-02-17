import { Vue, Component } from 'vue-property-decorator'


@Component({})
export default class PiRequestsMixin extends Vue {

  async transformRequest(request: Request): Promise<Request> {
    const token = await this.$auth.getAccessToken()
    const requestInit = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': "application/json"
      },
    }
    const newRequest = new Request(request, requestInit)
    return newRequest
  }
}
