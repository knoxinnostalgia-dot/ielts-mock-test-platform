/** Prefix a public-folder path with Vite's base URL (required on GitHub Pages). */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}
