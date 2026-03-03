import type { User, Session } from "@supabase/supabase-js"

export type { User, Session }

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}
