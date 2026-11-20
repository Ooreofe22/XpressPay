/** Applies the app palette (green-tinted neutrals, orange accent). See globals.css. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="app-surface min-h-screen bg-background text-foreground">{children}</div>
}
