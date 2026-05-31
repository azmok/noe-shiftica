declare module 'htmlhint' {
  interface HintMessage {
    line: number
    col: number
    message: string
    evidence?: string
    type: 'error' | 'warning'
    rule: { id: string; description: string; link: string }
  }
  type Ruleset = Record<string, boolean | string | number>
  interface HTMLHintStatic {
    verify(code: string, rules?: Ruleset): HintMessage[]
  }
  export const HTMLHint: HTMLHintStatic
}
