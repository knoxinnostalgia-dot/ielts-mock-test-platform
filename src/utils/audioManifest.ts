/**
 * Optional media overrides.
 *
 * The platform ships without binary audio, so every clip is rendered through
 * the browser speech-synthesis engine by default. Dropping MP3 files into
 * `public/audio` and listing them in `public/audio/manifest.json` makes the
 * player stream the real recording instead. Consulting the manifest first
 * avoids firing a request for every file that does not exist.
 */

import { publicUrl } from '@/utils/publicUrl'

let manifestPromise: Promise<Set<string>> | null = null

export function loadAudioManifest(): Promise<Set<string>> {
  if (manifestPromise) return manifestPromise

  manifestPromise = fetch(publicUrl('audio/manifest.json'), { cache: 'force-cache' })
    .then((response) => (response.ok ? response.json() : { files: [] }))
    .then((data: { files?: string[] }) => new Set(data.files ?? []))
    .catch(() => new Set<string>())

  return manifestPromise
}

/** Resolves the playable source for a clip, or null when speech should be used. */
export async function resolveClipSource(src: string | undefined): Promise<string | null> {
  if (!src) return null
  const files = await loadAudioManifest()
  const fileName = src.split('/').pop() ?? src
  return files.has(fileName) || files.has(src) ? publicUrl(src) : null
}
