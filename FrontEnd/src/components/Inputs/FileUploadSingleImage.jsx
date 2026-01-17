import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, Stack, IconButton, Button, Chip, CircularProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import "./FileUploadSingleImage.css";
import { createElement, isValidElement } from "react"; // ✅ add
import { useTranslation } from "react-i18next";


const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export default function FileUploadSingleImage({
  label,
  value, // File | null
  onChange,
  maxSize = 10 * 1024 * 1024,
  isBusy = false,
  helperText,
  icon, // can be ReactNode OR component (e.g. ReceiptIcon)
  emptyTitle,
  activeTitle,
}) {
  const { t } = useTranslation();
  const file = value ?? null;
  const [previewUrl, setPreviewUrl] = useState(null);

  const resolvedLabel = label ?? t("file.label");
  const resolvedHelper = helperText ?? t("file.helperText");
  const resolvedEmptyTitle = emptyTitle ?? t("file.emptyTitle");
  const resolvedActiveTitle = activeTitle ?? t("file.activeTitle");


  const iconNode = useMemo(() => {
    if (!icon) return <ImageIcon fontSize="small" />;
    if (isValidElement(icon)) return icon; // icon={<ReceiptIcon />}
    return createElement(icon, { fontSize: "small" }); // icon={ReceiptIcon}
  }, [icon]);


  useEffect(() => {
    if (!file) return setPreviewUrl(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onDrop = useCallback(
    (acceptedFiles) => onChange?.(acceptedFiles?.[0] ?? null),
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections, open } =
    useDropzone({
      onDrop,
      accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
      multiple: false,
      maxFiles: 1,
      maxSize,
      noClick: true,
      noKeyboard: true,
    });

  const errorMsg = useMemo(() => {
    if (!fileRejections?.length) return "";
    const r = fileRejections[0];
    return `${r.file.name}: ${r.errors?.[0]?.message ?? "Invalid file"}`;
  }, [fileRejections]);

  const state = isDragReject ? "reject" : isDragActive ? "active" : "idle";

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange?.(null);
  };

  return (
    <Box className="fu-root">
      <Stack direction="row" alignItems="center" justifyContent="space-between" className="fu-header">
        <Typography variant="subtitle2">{resolvedLabel}</Typography>
        {Boolean(file) && (
          <Button size="small" onClick={open} variant="text">
            {t("file.replace")}
          </Button>
        )}
      </Stack>

      <Box
        {...getRootProps()}
        className="fu-dropzone"
        data-state={state}
        data-hasfile={Boolean(file)}
        data-busy={isBusy}
        onClick={() => {
          if (!file) open();
        }}
      >
        <input {...getInputProps()} style={{ display: "none" }} />

        {!file ? (
          <Box className="fu-empty">
            <Box className="fu-iconBubble">
              {iconNode}
            </Box>

            <Box className="fu-text">
              <Typography variant="body2" className="fu-title">
                {isDragActive ? resolvedActiveTitle : resolvedEmptyTitle}
              </Typography>
              <Typography variant="caption" className="fu-subtitle">
                {isDragReject ? t("file.unsupported") : resolvedHelper}
              </Typography>
            </Box>

            <Box className="fu-actions">
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                startIcon={<CloudUploadOutlinedIcon fontSize="small" />}
              >
                <div className="fu-actions-btn-text">{t("file.browse")}</div>
              </Button>
            </Box>
          </Box>
        ) : (
          <Box className="fu-filled">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box className="fu-preview">
                {previewUrl ? (
                  <img className="fu-previewImg" src={previewUrl} alt={file.name} />
                ) : (
                  <ImageIcon fontSize="small" />
                )}
              </Box>

              <Box className="fu-fileMeta">
                <Typography variant="body2" className="fu-fileName" noWrap title={file.name}>
                  {file.name}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" className="fu-metaRow">
                  <Chip size="small" label={formatBytes(file.size)} />
                  {isBusy && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={14} />
                      <Typography variant="caption" className="fu-reading">
                        {t("file.reading")}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>

              <IconButton size="small" onClick={handleRemove} className="fu-removeBtn">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Typography variant="caption" className="fu-hint">
              {t("file.dragReplace")}
            </Typography>
          </Box>
        )}

        {Boolean(errorMsg) && (
          <Box className="fu-error">
            <Typography variant="caption">{errorMsg}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
