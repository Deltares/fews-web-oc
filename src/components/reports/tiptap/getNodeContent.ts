import { DOMOutputSpec, Fragment, Node } from '@tiptap/pm/model'

export function getNodeContent(node: Node | Fragment) {
  const childNodes: DOMOutputSpec[] = []
  for (let i = 0; i < node.childCount; i++) {
    const currentChild = node.child(i)
    if (currentChild.type.spec.toDOM) {
      const nodeDOMOutputSpec = currentChild.type.spec.toDOM(currentChild)
      const htmlTag = (nodeDOMOutputSpec as any)[0] as string
      const content = getNodeContent(currentChild.content)
      childNodes.push([htmlTag, currentChild.attrs, ...content])
    } else {
      if (currentChild.text) {
        childNodes.push(currentChild.text)
      }
    }
  }
  return childNodes
}
