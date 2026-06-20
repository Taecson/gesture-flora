export const LANDMARK_INDEX = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9
};

export function extractHandPoints(landmarks) {
  if (!landmarks || landmarks.length <= LANDMARK_INDEX.MIDDLE_MCP) {
    return null;
  }

  return {
    landmarks,
    wrist: landmarks[LANDMARK_INDEX.WRIST],
    thumbTip: landmarks[LANDMARK_INDEX.THUMB_TIP],
    indexTip: landmarks[LANDMARK_INDEX.INDEX_TIP],
    middleMCP: landmarks[LANDMARK_INDEX.MIDDLE_MCP]
  };
}
