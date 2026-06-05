import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';

export function EmptyChatState({ onCreateSession }) {
  const theme = useTheme();

  const suggestions = [
    { icon: '📄', text: 'Upload a PDF and ask questions' },
    { icon: '🗺', text: 'Generate a mind map from your notes' },
    { icon: '❓', text: 'Create a quiz to test your knowledge' },
    { icon: '📝', text: 'Generate structured study notes' },
  ];

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
      p: 4,
    }}>
      {/* Logo mark */}


      <Typography sx={{
        fontWeight: 900, fontSize: '2.2rem', letterSpacing: '-0.04em',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 0.5,
      }}>
        AurenLM
      </Typography>
      <Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary, mb: 3, maxWidth: 280 }}>
        Your AI study assistant. Create a session to get started.
      </Typography>

      {/* Suggestion chips */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 3.5, width: '100%', maxWidth: 300 }}>
        {suggestions.map((s, i) => (
          <Box key={i} sx={{
            display: 'flex', alignItems: 'center', gap: 1.25,
            px: 1.75, py: 0.875,
            borderRadius: '9px',
            bgcolor: theme.palette.action.hover,
            border: `1px solid ${theme.palette.divider}`,
            textAlign: 'left',
          }}>
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{s.icon}</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary }}>{s.text}</Typography>
          </Box>
        ))}
      </Box>

      {onCreateSession && (
        <Button
          variant="contained"
          onClick={onCreateSession}
          startIcon={<AddIcon />}
          sx={{ borderRadius: '9px', py: 1.1, px: 2.5, fontWeight: 700, fontSize: '0.85rem' }}
        >
          New Session
        </Button>
      )}
    </Box>
  );
}

export function EmptySessionState({ onCreateSession }) {
  const theme = useTheme();
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', textAlign: 'center', p: 4,
    }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: '14px',
        bgcolor: theme.palette.action.hover,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
      }}>
        <AutoAwesomeOutlinedIcon sx={{ color: theme.palette.primary.main }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 0.75 }}>No Sessions Yet</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 260, fontSize: '0.8rem' }}>
        Create your first session to organize documents and conversations
      </Typography>
      {onCreateSession && (
        <Button variant="contained" onClick={onCreateSession} startIcon={<AddIcon />}
          sx={{ borderRadius: '9px', fontWeight: 600 }}>
          Create Session
        </Button>
      )}
    </Box>
  );
}
