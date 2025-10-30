import { createFileRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInFormEmailLink } from '@/components/signInWithMagicLink';
import { SignOut } from '@/components/signOut';
import { Loader2Icon } from 'lucide-react';

export const Route = createFileRoute('/')({ component: App })

function App() {


  return (
    <div className="min-h-screen ">
      <AuthLoading>
        <Loader2Icon className="size-4 animate-spin" />
      </AuthLoading>
      <Unauthenticated>
        <SignInFormEmailLink />
      </Unauthenticated>
      <Authenticated>
        <SignOut />
        <div>Content</div>
      </Authenticated>
    </div>
  )
}
