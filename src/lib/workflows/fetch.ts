import { Workflow } from './types'

export async function fetchWorkflows(baseUrl: URL): Promise<Workflow[]> {
  // TODO: this should have
  //           a) JSON response
  //           b) a method in @deltares/fews-pi-requests
  const url = new URL('rest/fewspiservice/v1/workflows', baseUrl)
  const response = await fetch(url)
  if (response.status !== 200) {
    throw new Error('Failed to fetch workflows.')
  }
  const text = await response.text()
  const root = new DOMParser().parseFromString(text, 'text/xml')

  const workflowElements = root.querySelectorAll('workflow')

  const workflows: Workflow[] = []
  for (const element of workflowElements) {
    const workflowId = element.getAttribute('id') ?? ''
    const name = element.querySelector('name')?.textContent ?? ''
    const description = element.querySelector('description')?.textContent ?? ''
    workflows.push({ workflowId, name, description })
  }
  return workflows
}
