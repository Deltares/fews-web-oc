import { defineComponent, h } from 'vue'
import HighlightMatch from './HighlightMatch.vue'

export const Default = () => h(HighlightMatch, { value: 'Hello World', query: 'World' })

export const NoQuery = () => h(HighlightMatch, { value: 'Hello World' })

export const PartialMatch = () => h(HighlightMatch, { value: 'The quick brown fox', query: 'quick' })

export const CaseInsensitive = () => h(HighlightMatch, { value: 'JavaScript', query: 'script' })
