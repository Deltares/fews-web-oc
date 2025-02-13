export type ComponentProps<T> = T extends new (...angs: any) => {
  $props: infer P
}
  ? NonNullable<P>
  : T extends (props: infer P, ...args: any) => any
    ? P
    : {}

export type DeepRequired<T> = Required<{
  [K in keyof T]: T[K] extends Required<T[K]> ? T[K] : DeepRequired<T[K]>
}>
