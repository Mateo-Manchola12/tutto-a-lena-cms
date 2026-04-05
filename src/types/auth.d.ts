export type LoginResult =
  | {
      ok: true
    }
  | {
      ok: false
      reason: string
    }
