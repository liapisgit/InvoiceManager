const GOOGLE_DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([^/]+)/i,
  /drive\.google\.com\/open\?id=([^&]+)/i,
  /drive\.google\.com\/uc\?[^#]*id=([^&]+)/i,
  /docs\.google\.com\/uc\?[^#]*id=([^&]+)/i,
];

const getGoogleDriveFileId = (url) => {
  const normalizedUrl = String(url ?? "").trim();
  if (!normalizedUrl) return "";

  for (const pattern of GOOGLE_DRIVE_FILE_ID_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return "";
};

export const getPreviewConfig = (fileUrl) => {
  const normalizedUrl = String(fileUrl ?? "").trim();
  if (!normalizedUrl) {
    return { src: "", kind: "empty" };
  }

  const googleDriveFileId = getGoogleDriveFileId(normalizedUrl);
  if (googleDriveFileId) {
    return {
      src: `https://drive.google.com/file/d/${googleDriveFileId}/preview`,
      kind: "iframe",
    };
  }

  const lowerUrl = normalizedUrl.toLowerCase();
  if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(lowerUrl)) {
    return { src: normalizedUrl, kind: "image" };
  }
  if (/\.pdf(\?|#|$)/i.test(lowerUrl)) {
    return { src: normalizedUrl, kind: "iframe" };
  }

  return { src: normalizedUrl, kind: "link" };
};
