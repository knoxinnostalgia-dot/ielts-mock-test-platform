# Face detection model

Camera proctoring uses MediaPipe BlazeFace. The WebAssembly runtime is bundled
from `node_modules` so it works offline, but the model weights are downloaded
from the MediaPipe CDN the first time monitoring starts.

To run entirely offline, download the short-range face detector and save it here
as `blaze_face_short_range.tflite`:

```
https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite
```

The application checks for the local file first and only falls back to the CDN
when it is absent. If neither is reachable the camera preview still runs, a
`Monitoring Unavailable` integrity event is logged, and no penalty is applied.
