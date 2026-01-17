// FileUpload.jsx
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, Stack, IconButton } from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFileIcon';
import CloseIcon from "@mui/icons-material/Close";

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export default function FileUpload({
  label = "Upload files",
  value, // File[] (recommended) or null
  onChange,
  accept = {
    "application/pdf": [".pdf"],
    "image/*": [".png", ".jpg", ".jpeg", ".webp"],
  },
  multiple = true,
  maxSize, // e.g. 10 * 1024 * 1024
}) {
  const files = Array.isArray(value) ? value : [];

  const onDrop = useCallback(
    (acceptedFiles) => {
      // You can choose between "replace" vs "append"
      // Replace:
      onChange?.(acceptedFiles);

      // Append (uncomment if you prefer):
      // onChange?.([...files, ...acceptedFiles]);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } =
    useDropzone({
      onDrop,
      accept,
      multiple,
      maxSize,
    });

  const removeAt = (idx) => {
    const next = files.filter((_, i) => i !== idx);
    onChange?.(next);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label}
      </Typography>

      <Box
        {...getRootProps()}
        sx={{
          cursor: "pointer",
          borderRadius: 2,
          border: "2px dashed",
          borderColor: isDragReject ? "error.main" : isDragActive ? "primary.main" : "divider",
          bgcolor: isDragActive ? "action.hover" : "background.paper",
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          transition: "all 120ms ease",
        }}
      >
        <input {...getInputProps()} />
        {icon? icon :<UploadFileIcon fontSize="small" />}
        <Typography variant="body2">
          {isDragActive ? "Drop files here…" : "Drag & drop files here, or click to browse"}
        </Typography>
      </Box>

      {!!files.length && (
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {files.map((f, idx) => (
            <Box
              key={`${f.name}-${idx}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                px: 1.5,
                py: 1,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap title={f.name}>
                  {f.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(f.size)}
                </Typography>
              </Box>

              <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeAt(idx); }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}

      {!!fileRejections.length && (
        <Box sx={{ mt: 1 }}>
          {fileRejections.map((rej, i) => (
            <Typography key={i} variant="caption" color="error">
              {rej.file.name}: {rej.errors[0]?.message}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}
