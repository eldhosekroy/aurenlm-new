import React, { useState } from 'react';
import {
  Box, Typography, List, ListItem, IconButton, Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { useNotification } from '../hooks/useNotification';

function DocumentList({ files, onMainPointClick, onFileUpload, isOpen, togglePanel, currentSessionId, onDocumentSelect, onRemoveDocument }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showError, showInfo } = useNotification();
  const [isDragging, setIsDragging] = useState(false);

  const handleDocumentClick = (fileItem) => {
    onMainPointClick(fileItem.fullText, null);
    onDocumentSelect(fileItem.id);
  };

  const handleFileUploadChange = (event) => {
    if (currentSessionId) {
      showInfo('Uploading file…');
      onFileUpload(event, currentSessionId);
    } else {
      showError('Please select or create a session first.');
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!currentSessionId) { showError('Please select or create a session first.'); return; }
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      showInfo('Uploading file…');
      onFileUpload({ target: { files: droppedFiles } }, currentSessionId);
    }
  };

  const getFileIcon = (name = '') => {
    if (name.endsWith('.pdf')) return <PictureAsPdfOutlinedIcon sx={{ fontSize: 14, color: theme.palette.secondary.main }} />;
    return <InsertDriveFileOutlinedIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />;
  };

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Header ── */}
      <Box sx={{
        px: 2, py: 1.25,
        display: 'flex', alignItems: 'center', gap: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
      }}>
        <FolderOutlinedIcon sx={{ fontSize: 15, color: theme.palette.primary.main }} />
        <Typography sx={{
          fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.09em',
          textTransform: 'uppercase', color: theme.palette.text.secondary, flex: 1,
        }}>
          Documents
        </Typography>
      </Box>

      {/* ── File List ── */}
      <List sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {files.length === 0 && !isDragging && (
          <Box sx={{
            m: 1, p: 2.5, textAlign: 'center',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: '10px', opacity: 0.55,
          }}>
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 28, color: theme.palette.text.secondary, mb: 0.5 }} />
            <Typography variant="body2" sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary }}>
              Drop files or upload below
            </Typography>
          </Box>
        )}

        {/* Drag-over overlay hint */}
        {isDragging && (
          <Box sx={{
            m: 1, p: 2.5, textAlign: 'center',
            border: `1.5px dashed ${theme.palette.primary.main}`,
            borderRadius: '10px',
            bgcolor: `${theme.palette.primary.main}10`,
          }}>
            <CloudUploadOutlinedIcon sx={{ fontSize: 28, color: theme.palette.primary.main, mb: 0.5 }} />
            <Typography variant="body2" sx={{ fontSize: '0.78rem', color: theme.palette.primary.main, fontWeight: 600 }}>
              Drop to upload
            </Typography>
          </Box>
        )}

        {files.map((item, index) => (
          <ListItem
            key={item.id || index}
            disablePadding
            onClick={() => handleDocumentClick(item)}
            sx={{
              borderRadius: '10px',
              cursor: 'pointer',
              p: '7px 10px',
              border: `1px solid transparent`,
              transition: 'all 0.15s ease',
              '&:hover': {
                background: theme.palette.action.hover,
                border: `1px solid ${theme.palette.divider}`,
              },
              display: 'flex', alignItems: 'center', gap: 1,
              '&:hover .doc-remove': { opacity: 1 },
            }}
          >
            <Box sx={{
              width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
              background: `${theme.palette.secondary.main}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {getFileIcon(item.file?.name)}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{
                fontSize: '0.8rem', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: theme.palette.text.primary,
              }}>
                {item.file?.name}
              </Typography>
              {(item.summary === 'Summarizing…' || item.summary === 'Summarizing...') && (
                <Typography sx={{ fontSize: '0.68rem', color: theme.palette.primary.main }}>
                  Processing…
                </Typography>
              )}
            </Box>
            {files.length > 1 && (
              <IconButton
                className="doc-remove"
                size="small"
                onClick={(e) => { e.stopPropagation(); onRemoveDocument(item.id); }}
                sx={{
                  width: 20, height: 20, opacity: 0,
                  color: theme.palette.text.secondary,
                  transition: 'opacity 0.2s, color 0.2s',
                  '&:hover': { color: theme.palette.secondary.main },
                }}
              >
                <CloseIcon sx={{ fontSize: 13 }} />
              </IconButton>
            )}
          </ListItem>
        ))}
      </List>

      {/* ── Upload area ── */}
      <Box sx={{ mx: 1.25, mb: 1.25, mt: 0, flexShrink: 0 }}>
        <input
          type="file" multiple accept=".pdf"
          onChange={handleFileUploadChange}
          style={{ display: 'none' }}
          id="upload-button"
        />
        <label htmlFor="upload-button" style={{ display: 'block' }}>
          <Box sx={{
            p: 1.5,
            border: `1.5px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging
              ? `${theme.palette.primary.main}12`
              : 'transparent',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              background: `${theme.palette.primary.main}08`,
            },
          }}>
            <CloudUploadOutlinedIcon sx={{ fontSize: 20, color: theme.palette.primary.main, mb: 0.25 }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.primary.main }}>
              Upload Documents
            </Typography>
            <Typography sx={{ fontSize: '0.67rem', color: theme.palette.text.secondary, mt: 0.25 }}>
              PDF Only
            </Typography>
          </Box>
        </label>
      </Box>
    </Box>
  );
}

export default DocumentList;