import { Vue, Component } from 'vue-property-decorator'


@Component({})
export default class PiRequestsMixin extends Vue {

  getTransformRequest(controller?: AbortController) {
    return async (request: Request): Promise<Request> => {
      if (!this.$config.authenticationIsEnabled) return request
      // $auth only exists if authentication is enabled.
      if (controller !== undefined) {
        return await this.$auth.transformRequestAuth(request, controller.signal)
      }
      return await this.$auth.transformRequestAuth(request)
    }
  }
}
