import * as Plot from '@observablehq/plot'
import { h, withDirectives } from 'vue'

export default {
  props: ['options'],
  render() {
    const { options } = this as any
    console.log(options)
    return withDirectives(h('div'), [
      [
        {
          mounted(el: HTMLElement) {
            el.append(Plot.plot(options))
          },
        },
      ],
    ])
  },
}
