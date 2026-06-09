import { useMemo } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";

import { getPreviewConfig } from "../utils/invoicePreview";

export default function InvoiceFilePreview({
  fileUrl,
  title,
  subtitle,
  emptyMessage,
  helperMessage,
  frameTitle,
  unsupportedMessage,
  openOriginalLabel,
  altText,
  height = 520,
  sx,
}) {
  const normalizedUrl = String(fileUrl ?? "").trim();
  const previewConfig = useMemo(
    () => getPreviewConfig(normalizedUrl),
    [normalizedUrl],
  );

  let previewContent;

  if (!normalizedUrl) {
    previewContent = (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 3,
          borderRadius: 2,
          border: "1px dashed #cbd5e1",
          backgroundColor: "#f8fafc",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {helperMessage}
        </Typography>
      </Box>
    );
  } else if (previewConfig.kind === "image") {
    previewContent = (
      <Box
        component="img"
        src={previewConfig.src}
        alt={altText}
        sx={{
          width: "100%",
          height,
          objectFit: "contain",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          backgroundColor: "#f8fafc",
        }}
      />
    );
  } else if (previewConfig.kind === "iframe") {
    previewContent = (
      <Box
        component="iframe"
        src={previewConfig.src}
        title={frameTitle}
        sx={{
          width: "100%",
          height,
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          backgroundColor: "#fff",
        }}
      />
    );
  } else {
    previewContent = (
      <Box
        sx={{
          height,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 2,
          px: 3,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          backgroundColor: "#f8fafc",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {unsupportedMessage}
        </Typography>
        <Button
          variant="contained"
          component="a"
          href={normalizedUrl}
          target="_blank"
          rel="noreferrer"
        >
          {openOriginalLabel}
        </Button>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 4,
        border: "1px solid #d1d5db",
        ...sx,
      }}
    >
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {normalizedUrl ? subtitle : emptyMessage}
      </Typography>
      {previewContent}
    </Paper>
  );
}
