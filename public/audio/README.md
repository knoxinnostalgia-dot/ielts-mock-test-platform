# Audio assets

The listening and speaking modules work out of the box without any files in this
folder: every clip is rendered through the browser's speech-synthesis engine
using the transcript stored alongside the questions. The two-play limit, the
progress bar and the playback lock all behave identically either way.

## Using real recordings instead

1. Drop MP3 files into this folder using the clip id as the file name, for example:

   ```
   public/audio/lb-clip-1.mp3
   public/audio/li-clip-2.mp3
   public/audio/sb-r1.mp3
   ```

   The clip ids are defined in `src/data/listeningSections.ts` and
   `src/data/speakingTasks.ts`.

2. List the file names in `manifest.json`:

   ```json
   { "files": ["lb-clip-1.mp3", "lb-clip-2.mp3"] }
   ```

Any clip listed in the manifest is streamed from the file. Anything not listed
falls back to speech synthesis, so you can mix the two freely.
