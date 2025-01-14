export type ComponentProps<T> = T extends new (...angs: any) => {
  $props: infer P
}
  ? NonNullable<P>
  : T extends (props: infer P, ...args: any) => any
    ? P
    : {}
