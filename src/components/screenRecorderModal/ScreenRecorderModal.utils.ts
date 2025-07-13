export const createVideoConstraints = (sourceId: string) => ({
  chromeMediaSource: "desktop",
  chromeMediaSourceId: sourceId,
  width: { min: 1280, ideal: 1920, max: 1920 },
  height: { min: 720, ideal: 1080, max: 1080 },
  frameRate: { ideal: 30, max: 60 },
});
