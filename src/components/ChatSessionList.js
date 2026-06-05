import React, { useState } from 'react';
import {
  Box, Typography, List, ListItem, IconButton, Tooltip, TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CheckIcon from '@mui/icons-material/Check';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useNotification } from '../hooks/useNotification';
import axios from 'axios';

/* ─── Panel Section Header ────────────────────────────────────────────── */
function PanelHeader({ title, icon, action }) {
  const theme = useTheme();
  return (
    <Box sx={{
      px: 2, py: 1.25,
      display: 'flex', alignItems: 'center', gap: 1,
      borderBottom: `1px solid ${theme.palette.divider}`,
      flexShrink: 0,
    }}>
      <Box sx={{ color: theme.palette.primary.main, display: 'flex' }}>{icon}</Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.palette.text.secondary, flex: 1 }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}

function ChatSessionList({ onSelectSession, currentSessionId, sessions, onSessionCreated }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showSuccess, showError } = useNotification();
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleCreateSession = async () => {
    try {
      const defaultTitle = `New Session - ${new Date().toLocaleString()}`;
      const response = await axios.post('http://localhost:5000/sessions', { title: defaultTitle }, { withCredentials: true, timeout: 30000 });
      if (response.status === 201) {
        onSessionCreated();
        onSelectSession(response.data.id);
        showSuccess('New session created!');
      }
    } catch (error) {
      console.error("Error creating session:", error);
      showError('Failed to create session. Please try again.');
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this session?")) {
      try {
        await axios.delete(`http://localhost:5000/sessions/${sessionId}`, { withCredentials: true, timeout: 30000 });
        onSessionCreated();
        if (currentSessionId === sessionId) onSelectSession(null);
        showSuccess('Session deleted');
      } catch (error) {
        showError('Failed to delete session.');
      }
    }
  };

  const handleRenameSession = async (sessionId, e) => {
    e?.stopPropagation();
    if (!editingTitle.trim()) { showError('Title cannot be empty'); return; }
    try {
      await axios.put(`http://localhost:5000/api/sessions/${sessionId}/rename`, { title: editingTitle }, { withCredentials: true });
      onSessionCreated();
      setEditingSessionId(null);
      setEditingTitle('');
      showSuccess('Session renamed');
    } catch (error) {
      showError('Failed to rename session');
    }
  };

  const startEditing = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 86400000;
    if (diff < 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PanelHeader
        title="Sessions"
        icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />}
        action={
          <Tooltip title="New Session">
            <IconButton
              size="small"
              onClick={handleCreateSession}
              sx={{
                width: 26, height: 26,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                color: '#fff',
                borderRadius: '7px',
                '&:hover': { transform: 'scale(1.1)', boxShadow: `0 4px 12px ${theme.palette.primary.main}50` },
              }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        }
      />

      <List sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {sessions.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center', opacity: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>No sessions yet</Typography>
          </Box>
        )}
        {sessions.map((session) => {
          const isSelected = session.id === currentSessionId;
          return (
            <ListItem
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              disablePadding
              sx={{
                borderRadius: '10px',
                cursor: 'pointer',
                p: '6px 10px',
                background: isSelected
                  ? theme.palette.action.selected
                  : 'transparent',
                border: isSelected
                  ? `1px solid ${theme.palette.primary.main}50`
                  : '1px solid transparent',
                transition: 'all 0.15s ease',
                '&:hover': {
                  background: isSelected ? theme.palette.action.selected : theme.palette.action.hover,
                },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 13, color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary, flexShrink: 0 }} />
                  {editingSessionId === session.id ? (
                    <TextField
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      variant="standard"
                      size="small"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSession(session.id);
                        if (e.key === 'Escape') setEditingSessionId(null);
                      }}
                      InputProps={{ disableUnderline: false, sx: { fontSize: '0.82rem', fontWeight: 500 } }}
                      sx={{ flex: 1 }}
                    />
                  ) : (
                    <Typography sx={{
                      fontSize: '0.82rem', fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {session.title}
                    </Typography>
                  )}
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, pl: '17px' }}>
                  {formatDate(session.created_at)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0, opacity: 0, '.MuiListItem-root:hover &': { opacity: 1 } }}
                className="session-actions">
                {editingSessionId === session.id ? (
                  <IconButton size="small" onClick={(e) => handleRenameSession(session.id, e)}
                    sx={{ width: 22, height: 22, color: '#4ADE80' }}>
                    <CheckIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                ) : (
                  <IconButton size="small" onClick={(e) => startEditing(session, e)}
                    sx={{ width: 22, height: 22, color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } }}>
                    <EditOutlinedIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                )}
                <IconButton size="small" onClick={(e) => handleDeleteSession(session.id, e)}
                  sx={{ width: 22, height: 22, color: theme.palette.text.secondary, '&:hover': { color: '#FF6584' } }}>
                  <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default ChatSessionList;
