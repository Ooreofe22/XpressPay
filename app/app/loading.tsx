/**
 * Shown while the /app route loads (after a CTA click on the landing page).
 * Mirrors the auth form layout so nothing jumps when the real screen arrives.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen bg-card" aria-busy="true" aria-label="Loading">
      <div className="splash-gradient hidden lg:block lg:w-[46%] xl:w-[50%]" />
      <div className="flex flex-1 flex-col justify-center px-5 sm:px-8">
        <div className="mx-auto w-full max-w-md space-y-4">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-9 w-3/4 rounded-xl" />
          <div className="skeleton h-4 w-full rounded-full" />
          <div className="skeleton mt-6 h-13 w-full rounded-xl" />
          <div className="skeleton h-13 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
