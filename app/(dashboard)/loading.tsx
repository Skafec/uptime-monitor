// Instant navigation feedback. Rendered by Next.js the moment a dashboard
// route is requested, while its server component fetches — so clicking a nav
// link swaps to this skeleton immediately instead of leaving the old page
// frozen for a second or two. Renders inside the layout's <main>, so no outer
// padding/width needed here.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-48 bg-gray-200 dark:bg-slate-800 rounded-lg" />
      <div className="space-y-3">
        <div className="h-24 bg-gray-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
        <div className="h-24 bg-gray-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
        <div className="h-24 bg-gray-100 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl" />
      </div>
    </div>
  )
}
