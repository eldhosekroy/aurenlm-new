import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, IconButton, Typography, Tooltip, Switch, CircularProgress, Menu, MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import PaletteIcon from '@mui/icons-material/Palette';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DocumentList from './components/DocumentList';
import Chat from './components/Chat';
import Studio from './components/Studio';
import ChatSessionList from './components/ChatSessionList';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { EmptyChatState } from './components/EmptyState';
import axios from 'axios';
import { ThemeContext } from './ThemeContext';
import { AuthContext } from './AuthContext';
import LoginPage from './components/LoginPage';
import { useNotification } from './hooks/useNotification';

const PANEL_W = 260; // fixed px width for side panels

/* ─── Top App Bar ─────────────────────────────────────────────── */
function AppHeader({ mode, toggleTheme, colorTheme, setColorTheme, colorThemes, logout, sessionName }) {
  const theme = useTheme();
  const isDark = mode === 'dark';
  const [anchorEl, setAnchorEl] = useState(null);

  const handlePaletteClick = (event) => setAnchorEl(event.currentTarget);
  const handlePaletteClose = () => setAnchorEl(null);
  const handleThemeSelect = (themeKey) => {
    setColorTheme(themeKey);
    handlePaletteClose();
  };

  return (
    <Box component="header" sx={{
      height: 52,
      display: 'flex',
      alignItems: 'center',
      px: 2,
      gap: 2,
      flexShrink: 0,
      bgcolor: 'background.paper',
      borderBottom: `1px solid ${theme.palette.divider}`,
      zIndex: 10,
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

        <Typography sx={{
          fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.03em',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          AurenLM
        </Typography>
      </Box>

      {/* Divider + session name */}
      {sessionName && (
        <>
          <Box sx={{ width: 1, height: 18, bgcolor: theme.palette.divider }} />
          <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, fontWeight: 500 }}>
            {sessionName}
          </Typography>
        </>
      )}

      <Box sx={{ flex: 1 }} />

      {/* Light/Dark toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <LightModeIcon sx={{ fontSize: 15, color: theme.palette.text.secondary }} />
        <Switch
          size="small"
          checked={isDark}
          onChange={toggleTheme}
          sx={{
            '& .MuiSwitch-thumb': { bgcolor: theme.palette.primary.main },
            '& .MuiSwitch-track': {
              bgcolor: `${theme.palette.primary.main}50 !important`,
              opacity: '1 !important',
            },
          }}
        />
        <DarkModeIcon sx={{ fontSize: 15, color: theme.palette.text.secondary }} />
      </Box>

      {/* Theme Palette */}
      <Tooltip title="Color Theme">
        <IconButton size="small" onClick={handlePaletteClick} sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } }}>
          <PaletteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePaletteClose}
        PaperProps={{
          sx: { mt: 1, borderRadius: 2, minWidth: 150, boxShadow: theme.shadows[4] }
        }}
      >
        {Object.entries(colorThemes || {}).map(([key, config]) => (
          <MenuItem
            key={key}
            selected={colorTheme === key}
            onClick={() => handleThemeSelect(key)}
            sx={{ fontSize: '0.85rem', fontWeight: colorTheme === key ? 600 : 400 }}
          >
            {config.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Logout */}
      <Tooltip title="Logout">
        <IconButton size="small" onClick={logout}
          sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.secondary.main } }}>
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

/* ─── Panel Toggle Tab (vertical strip on the edge) ──────────── */
function PanelToggle({ open, onClick, side }) {
  const theme = useTheme();
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 18,
        alignSelf: 'stretch',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: side === 'left' ? '0 6px 6px 0' : '6px 0 0 6px',
        borderLeft: side === 'left' ? 'none' : undefined,
        borderRight: side === 'right' ? 'none' : undefined,
        transition: 'background 0.15s',
        '&:hover': { bgcolor: theme.palette.action.hover },
        zIndex: 2,
      }}
    >
      {side === 'left'
        ? (open ? <ChevronLeftIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                : <ChevronRightIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />)
        : (open ? <ChevronRightIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                : <ChevronLeftIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />)
      }
    </Box>
  );
}

/* ─── App ─────────────────────────────────────────────────────── */
function App() {
  const [chatContext, setChatContext] = useState(null);
  const [files, setFiles] = useState([]);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [chatQueryFromMindmap, setChatQueryFromMindmap] = useState(null);
  const [fileUploadSummary, setFileUploadSummary] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [leftTab, setLeftTab] = useState('sessions'); // 'sessions' | 'docs'

  const { mode, toggleTheme, colorTheme, setColorTheme, colorThemes } = useContext(ThemeContext);
  const { isAuthenticated, loading, logout } = useContext(AuthContext);
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();
  const isDark = mode === 'dark';
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const fetchSessions = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const res = await axios.get('http://localhost:5000/sessions', { withCredentials: true });
        setSessions(res.data);
      } catch (e) { console.error(e); }
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); setShortcutsOpen(true); }
      if (e.key === 'Escape') setShortcutsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    setSessionData(null); 
    setChatContext(null); 
    setFiles([]);
    if (currentSessionId && isAuthenticated) {
      (async () => {
        try {
          const res = await axios.get(`http://localhost:5000/sessions/${currentSessionId}`, { withCredentials: true });
          setSessionData(res.data);
          let msgs = res.data.messages.map((m, idx) => ({
            sender: m.sender === 'gemini' ? 'ai' : m.sender,
            text: m.content,
            timestamp: m.timestamp, // preserve real server timestamp
            id: `db-${currentSessionId}-${idx}`, // stable ID from DB position
          }));
          const fd = res.data.files;
          if (fd?.length > 0) {
            const existing = new Set(msgs.map(m => m.text));
            const summaryMsgs = fd.map(f => f.summary).filter(s => s && !existing.has(s)).map((s, i) => ({ sender: 'ai', text: s, id: `summary-${currentSessionId}-${i}` }));
            msgs = [...summaryMsgs, ...msgs];
          }
          setChatContext({ fullText: res.data.files.map(f => f.fullText).join('\n\n'), contextPrompt: null, initialMessages: msgs });
          const loadedFiles = res.data.files.map(f => ({ file: { name: f.filename }, summary: f.summary, fullText: f.fullText, id: f.id }));
          setFiles(loadedFiles);
          setSelectedDocumentId(loadedFiles.length > 0 ? loadedFiles[0].id : null);
        } catch (e) {
          console.error(e);
          setSessionData(null); setChatContext(null); setFiles([]);
        }
      })();
    } else if (!currentSessionId) {
      setSessionData(null); setChatContext(null); setFiles([]);
    }
  }, [currentSessionId, isAuthenticated]);

  useEffect(() => {
    if (chatQueryFromMindmap) {
      setChatContext(prev => ({ ...prev, initialMessage: chatQueryFromMindmap }));
      setChatQueryFromMindmap(null);
    }
  }, [chatQueryFromMindmap]);

  const handleMainPointClick = (fullText, mainPoint) =>
    setChatContext({ fullText, contextPrompt: mainPoint });

  const uploadAndSummarize = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('session_id', currentSessionId);
    try {
      const res = await axios.post('http://localhost:5000/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true, timeout: 180000,
      });
      return res.data;
    } catch (e) { console.error(e); return null; }
  };

  const handleFileChange = async (event) => {
    const selected = Array.from(event.target.files);
    const isFirst = files.length === 0;
    for (const file of selected) {
      setFiles(prev => [...prev, { file, summary: 'Summarizing…', fullText: '' }]);
      const result = await uploadAndSummarize(file);
      if (result?.summary) {
        if (isFirst) {
          try {
            const tr = await axios.post(`http://localhost:5000/api/sessions/${currentSessionId}/generate-title`, {}, { withCredentials: true });
            if (tr.data?.title) setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title: tr.data.title } : s));
          } catch (e) { console.error(e); }
        }
        setFiles(prev => prev.map(f => f.file === file ? { ...f, summary: result.summary, fullText: result.fullText, id: result.file_id } : f));
        if (!selectedDocumentId) setSelectedDocumentId(result.file_id);
        setChatContext(prev => ({ ...prev, fullText: (prev?.fullText || '') + '\n\n' + result.fullText, contextPrompt: null }));
        setFileUploadSummary(result.summary);
      } else {
        setFiles(prev => prev.map(f => f.file === file ? { ...f, summary: 'Failed to summarize.' } : f));
      }
    }
  };

  const handleRemoveDocument = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/documents/${id}`, { withCredentials: true });
      const updated = files.filter(f => f.id !== id);
      setFiles(updated);
      setChatContext(prev => ({ ...prev, fullText: updated.map(f => f.fullText).join('\n\n') }));
      if (selectedDocumentId === id) setSelectedDocumentId(updated.length > 0 ? updated[0].id : null);
      showSuccess('Document removed.');
    } catch (e) { showError('Failed to remove document.'); }
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await axios.post('http://localhost:5000/sessions', { title: `Session — ${new Date().toLocaleString()}` }, { withCredentials: true });
      if (res.status === 201) { fetchSessions(); setCurrentSessionId(res.data.id); showSuccess('New session created!'); }
    } catch (e) { showError('Failed to create session.'); }
  };

  /* ── Panel shared styles ── */
  const panelBase = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    bgcolor: 'background.paper',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '10px',
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2, bgcolor: 'background.default' }}>

        <CircularProgress size={22} sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <AppHeader 
        mode={mode} 
        toggleTheme={toggleTheme} 
        colorTheme={colorTheme}
        setColorTheme={setColorTheme}
        colorThemes={colorThemes}
        logout={logout} 
        sessionName={currentSession?.title} 
      />

      {/* ── 3-panel workspace ── */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0, p: '8px', gap: '6px', overflow: 'hidden' }}>

        {/* LEFT PANEL */}
        <Box sx={{
          display: 'flex',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.3s ease',
          width: leftPanelOpen ? PANEL_W : 0,
          minWidth: leftPanelOpen ? PANEL_W : 0,
        }}>
          <Box sx={{ ...panelBase, width: PANEL_W, minWidth: PANEL_W }}>

            {/* ── Tab bar (only when inside a session) ── */}
            {currentSessionId && (
              <Box sx={{
                display: 'flex',
                borderBottom: `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
              }}>
                {[{ id: 'sessions', label: 'Sessions' }, { id: 'docs', label: 'Documents' }].map(tab => (
                  <Box
                    key={tab.id}
                    onClick={() => setLeftTab(tab.id)}
                    sx={{
                      flex: 1, textAlign: 'center', py: 0.9,
                      cursor: 'pointer',
                      fontSize: '0.72rem', fontWeight: 600,
                      color: leftTab === tab.id ? theme.palette.primary.main : theme.palette.text.secondary,
                      borderBottom: leftTab === tab.id
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                      bgcolor: leftTab === tab.id ? theme.palette.action.selected : 'transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': { color: theme.palette.primary.main, bgcolor: theme.palette.action.hover },
                      userSelect: 'none',
                    }}
                  >
                    {tab.label}
                  </Box>
                ))}
              </Box>
            )}

            {/* ── Panel content ── */}
            {!currentSessionId || leftTab === 'sessions' ? (
              <ChatSessionList
                onSelectSession={(id) => { setCurrentSessionId(id); setLeftTab('docs'); }}
                currentSessionId={currentSessionId}
                sessions={sessions}
                onSessionCreated={fetchSessions}
              />
            ) : (
              <DocumentList
                files={files}
                onMainPointClick={handleMainPointClick}
                onFileUpload={handleFileChange}
                isOpen={leftPanelOpen}
                togglePanel={() => setLeftPanelOpen(p => !p)}
                currentSessionId={currentSessionId}
                onDocumentSelect={setSelectedDocumentId}
                onRemoveDocument={handleRemoveDocument}
              />
            )}
          </Box>
        </Box>

        {/* Left toggle strip */}
        <PanelToggle open={leftPanelOpen} onClick={() => setLeftPanelOpen(p => !p)} side="left" />

        {/* CENTRE PANEL */}
        <Box sx={{ flex: 1, minWidth: 0, ...panelBase }}>
          {currentSessionId ? (
            <Chat
              key={currentSessionId}
              contextPrompt={chatContext?.contextPrompt}
              pdfContent={chatContext?.fullText}
              mindmapQuery={chatQueryFromMindmap}
              setChatQueryFromMindmap={setChatQueryFromMindmap}
              fileUploadSummary={fileUploadSummary}
              setFileUploadSummary={setFileUploadSummary}
              currentSessionId={currentSessionId}
              initialMessages={chatContext?.initialMessages || []}
              sessionName={currentSession?.title}
            />
          ) : (
            <EmptyChatState onCreateSession={handleCreateNewSession} />
          )}
        </Box>

        {/* Right toggle strip */}
        <PanelToggle open={rightPanelOpen} onClick={() => setRightPanelOpen(p => !p)} side="right" />

        {/* RIGHT PANEL */}
        <Box sx={{
          display: 'flex',
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.3s ease',
          width: rightPanelOpen ? PANEL_W : 0,
          minWidth: rightPanelOpen ? PANEL_W : 0,
        }}>
          <Box sx={{ ...panelBase, width: PANEL_W, minWidth: PANEL_W }}>
            {currentSessionId && (
              <Studio
                isOpen={rightPanelOpen}
                togglePanel={() => setRightPanelOpen(p => !p)}
                sessionPdfContent={chatContext?.fullText}
                onMindmapQuery={setChatQueryFromMindmap}
                currentSessionId={currentSessionId}
                initialMindmapData={sessionData?.mindmap}
                documentId={selectedDocumentId}
              />
            )}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}

export default App;