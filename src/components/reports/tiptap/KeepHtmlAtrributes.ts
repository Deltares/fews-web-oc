import { Extension } from '@tiptap/core'

const EXCLUDED_DATA_ATTIBUTES = ['data-status', 'data-status-definition']

export const KeepHtmlAttributes = Extension.create({
  name: 'keepHtmlAttributes',
  addGlobalAttributes() {
    return [
      {
        types: [
          'section',
          'bold',
          'division',
          'draggableItem',
          'header',
          'heading',
          'image',
          'paragraph',
          'table',
          'tableCell',
          'tableHeader',
          'tableRow',
          'time',
          'data',
          'menu',
        ],
        attributes: {
          dataStatus: {
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-status'),
            renderHTML: (attributes) => {
              if (attributes.dataStatus === null) {
                return {}
              }
              return { 'data-status': attributes.dataStatus }
            },
          },
          dataStatusDefinition: {
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('data-status-definition'),
            renderHTML: (attributes) => {
              if (attributes.dataStatus === null) {
                return {}
              }
              return {
                'data-status-definition': attributes.dataStatusDefinition,
              }
            },
          },
          dataSet: {
            parseHTML: (element: HTMLElement) => {
              const result = Object.keys(element.dataset)
                .filter(
                  (key) => !EXCLUDED_DATA_ATTIBUTES.includes(`data-${key}`),
                )
                .reduce((obj: Record<string, string | undefined>, key) => {
                  obj[key] = element.dataset[key]
                  return obj
                }, {})
              return result
            },
            renderHTML: (attributes) => {
              if (attributes.dataSet === null) {
                return {}
              }
              const result: Record<string, string> = {}
              for (const key in attributes.dataSet) {
                const dataAttribute = `data-${camelToSnake(key)}`
                result[dataAttribute] = attributes.dataSet[key]
              }
              return result
            },
          },
          class: {
            parseHTML: (element: HTMLElement) => element.getAttribute('class'),
          },
          style: {
            parseHTML: (element: HTMLElement) => element.getAttribute('style'),
          },
          id: {
            parseHTML: (element: HTMLElement) => element.getAttribute('id'),
          },
          datetime: {
            parseHTML: (element: HTMLElement) =>
              element.getAttribute('datetime'),
          },
        },
      },
    ]
  },
})

function camelToSnake(str: string | undefined) {
  if (str === undefined) {
    return undefined
  }
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}
