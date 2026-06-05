import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Skeleton,
  TextField,
  InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNotification } from '../hooks/useNotification';

/* ─── Chat Header ─────────────────────────────────────────────────── */
function ChatHeader({ sessionName }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{
      px: 2.5, py: 1.5,
      borderBottom: `1px solid ${theme.palette.divider}`,
      display: 'flex', alignItems: 'center', gap: 1.5,
      flexShrink: 0,
    }}>
      <Box sx={{
        width: 30, height: 30, borderRadius: '9px',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 3px 10px ${theme.palette.primary.main}40`,
      }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 18, color: '#fff' }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
          AurenLM
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ADE80', boxShadow: '0 0 6px rgba(74,222,128,0.7)' }} />
          <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>
            {sessionName ? sessionName : 'Ready to help'}
          </Typography>
        </Box>
      </Box>
      {/* online dot already moved into subtitle */}
    </Box>
  );
}

/* ─── Typing Indicator ─────────────────────────────────────────────── */
function TypingIndicator() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 2 }} className="ai-message-enter">
      <Box sx={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: theme.palette.action.hover,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
      }}>
        <SmartToyOutlinedIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
      </Box>
      <Box sx={{
        px: 2, py: 1.5, borderRadius: '16px 16px 16px 4px',
        background: isDark ? `rgba(40,52,46,0.8)` : `rgba(245,250,247,0.9)`,
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex', alignItems: 'center', gap: 0.5,
      }}>
        <span className="typing-dot" style={{ color: theme.palette.primary.main }} />
        <span className="typing-dot" style={{ color: theme.palette.primary.main }} />
        <span className="typing-dot" style={{ color: theme.palette.primary.main }} />
      </Box>
    </Box>
  );
}

/* ─── Message Bubble ───────────────────────────────────────────────── */
function MessageBubble({ message, onCopy, onSpeak, isSpeaking }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isUser = message.sender === 'user';

  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 1,
        mb: 2,
      }}
      className={isUser ? 'user-message-enter' : 'ai-message-enter'}
    >
      {/* Avatar */}
      {!isUser && (
        <Box sx={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: theme.palette.action.hover,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 0.5,
        }}>
          <SmartToyOutlinedIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
        </Box>
      )}

      {/* Bubble + actions group */}
      <Box sx={{
        maxWidth: '72%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 0.5,
      }}>
        {!isUser && (
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: theme.palette.text.secondary, pl: 0.5 }}>
            AurenLM
          </Typography>
        )}

        <Box sx={{ position: 'relative', '&:hover .msg-actions': { opacity: 1 } }}>
          {/* Actions overlay */}
          <Box className="msg-actions" sx={{
            position: 'absolute',
            top: -28,
            [isUser ? 'left' : 'right']: 0,
            opacity: 0,
            transition: 'opacity 0.2s ease',
            display: 'flex', gap: 0.25, bgcolor: isDark ? '#16162A' : '#fff',
            borderRadius: '8px', border: `1px solid ${theme.palette.divider}`,
            px: 0.5, py: 0.25,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 2,
          }}>
            {!isUser && (
              <Tooltip title={isSpeaking ? 'Stop' : 'Listen'}>
                <IconButton size="small" onClick={() => onSpeak(message.text)}
                  sx={{ width: 24, height: 24, color: theme.palette.text.secondary }}>
                  {isSpeaking ? <StopIcon sx={{ fontSize: 14 }} /> : <VolumeUpIcon sx={{ fontSize: 14 }} />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => onCopy(message.text)}
                sx={{ width: 24, height: 24, color: theme.palette.text.secondary }}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Bubble */}
          <Box sx={{
            px: 2, py: 1.25,
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: isUser
              ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
              : isDark ? 'rgba(32,46,40,0.9)' : 'rgba(246,251,248,0.95)',
            border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
            boxShadow: isUser
              ? `0 4px 16px ${theme.palette.primary.main}35`
              : isDark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(82,183,136,0.06)',
            color: isUser ? '#fff' : theme.palette.text.primary,
            '& p': { margin: 0, lineHeight: 1.6 },
            '& p + p': { marginTop: '0.5em' },
            '& code': {
              background: isUser ? 'rgba(255,255,255,0.2)' : theme.palette.action.hover,
              borderRadius: 4, px: 0.5, fontSize: '0.82em',
              fontFamily: "'JetBrains Mono', monospace",
            },
            '& pre': {
              background: isUser ? 'rgba(255,255,255,0.15)' : theme.palette.background.default,
              borderRadius: 8, p: 1.5, overflow: 'auto',
            },
          }}>
            {!isUser ? (
              <Box sx={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{message.text}</Typography>
            )}
          </Box>
        </Box>

        {/* Timestamp */}
        <Typography sx={{
          fontSize: '0.68rem',
          color: theme.palette.text.secondary,
          px: 0.5,
          display: 'flex', alignItems: 'center', gap: 0.5,
        }}>
          {timeStr}
          {isUser && (
            <Box component="span" sx={{ color: theme.palette.primary.light, fontSize: '0.8em' }}>✓✓</Box>
          )}
        </Typography>
      </Box>
    </Box>
  );
}

/* ─── Chat Input Bar ───────────────────────────────────────────────── */
function ChatInput({ value, onChange, onSend, onKeyPress, disabled }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hasContent = value.trim().length > 0;

  return (
    <Box sx={{
      px: 2, py: 1.5,
      borderTop: `1px solid ${theme.palette.divider}`,
      bgcolor: 'background.paper',
      flexShrink: 0,
    }}>
      <Box sx={{
        display: 'flex', alignItems: 'flex-end', gap: 1.5,
        bgcolor: isDark ? theme.palette.background.default : '#fff',
        borderRadius: '14px',
        border: `1.5px solid ${hasContent ? theme.palette.primary.main + '88' : theme.palette.divider}`,
        px: 2, py: 1,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hasContent
          ? `0 0 0 3px ${theme.palette.primary.main}18`
          : 'none',
      }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="standard"
          placeholder="Type your message…"
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          disabled={disabled}
          InputProps={{ disableUnderline: true }}
          sx={{
            '& .MuiInputBase-root': { fontSize: '0.875rem', py: 0.25 },
            '& textarea': { color: theme.palette.text.primary },
            '& textarea::placeholder': { color: theme.palette.text.secondary, opacity: 0.7 },
          }}
        />

        {/* Send button */}
        <IconButton
          onClick={onSend}
          disabled={!hasContent || disabled}
          size="small"
          sx={{
            width: 36, height: 36,
            background: hasContent && !disabled
              ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
              : theme.palette.action.hover,
            color: hasContent && !disabled ? (isDark ? '#111' : '#fff') : theme.palette.text.secondary,
            borderRadius: '10px',
            flexShrink: 0,
            boxShadow: hasContent && !disabled ? `0 4px 12px ${theme.palette.primary.main}40` : 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: hasContent && !disabled ? 'scale(1.08)' : 'none',
              boxShadow: hasContent && !disabled ? `0 6px 16px ${theme.palette.primary.main}55` : 'none',
            },
            '&.Mui-disabled': { background: theme.palette.action.hover },
          }}
        >
          <SendIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      <Typography sx={{ fontSize: '0.68rem', color: theme.palette.text.secondary, mt: 0.75, textAlign: 'center' }}>
        Shift+Enter for new line · Enter to send
      </Typography>
    </Box>
  );
}

/* ─── Main Chat Component ──────────────────────────────────────────── */
function Chat({ contextPrompt, pdfContent, mindmapQuery, setChatQueryFromMindmap, fileUploadSummary, setFileUploadSummary, currentSessionId, initialMessages, sessionName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const messagesEndRef = useRef(null);
  const { showSuccess, showError } = useNotification();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isAIThinking]);

  const handleSpeak = (text) => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    speechRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const sendQueryToGemini = useCallback(async (queryText) => {
    if (!currentSessionId) { showError("Please select or create a session first."); return; }
    setIsAIThinking(true);
    const aiMessageId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, { text: '', sender: 'ai', timestamp: new Date(), id: aiMessageId, isStreaming: true }]);

    try {
      const response = await fetch('http://localhost:5000/gemini_completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: queryText, session_id: currentSessionId, stream: true })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const currentText = fullText;
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: currentText } : msg));
      }
      setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg));
    } catch (error) {
      console.error('Error fetching AI response:', error);
      showError("Failed to get AI response.");
      setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
    } finally {
      setIsAIThinking(false);
    }
  }, [currentSessionId, showError]);

  useEffect(() => {
    setInput('');
    let isMounted = true;
    if (initialMessages && initialMessages.length > 0) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        if (isMounted) {
          setMessages(initialMessages.map((msg, idx) => ({
            ...msg,
            // Use real server timestamp if available, otherwise fall back to a spaced fake one
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(Date.now() - (initialMessages.length - idx) * 60000),
            id: msg.id || `loaded-${currentSessionId}-${idx}`,
          })));
          setIsLoading(false);
        }
      }, 300);
      return () => { isMounted = false; clearTimeout(timer); };
    } else {
      setMessages([]);
      setIsLoading(false);
    }
  }, [initialMessages, currentSessionId]);

  useEffect(() => {
    if (mindmapQuery) {
      setMessages(prev => [...prev, { text: mindmapQuery, sender: 'user', timestamp: new Date(), id: `user-mm-${Date.now()}` }]);
      sendQueryToGemini(mindmapQuery);
      setChatQueryFromMindmap(null);
    }
  }, [mindmapQuery, sendQueryToGemini, setChatQueryFromMindmap]);

  useEffect(() => {
    if (fileUploadSummary) {
      setMessages(prev => [...prev, { text: fileUploadSummary, sender: 'ai', timestamp: new Date(), id: Date.now() }]);
      setFileUploadSummary(null);
    }
  }, [fileUploadSummary, setFileUploadSummary]);

  const handleSend = async () => {
    if (input.trim() === '') return;
    const userMessage = { text: input, sender: 'user', timestamp: new Date(), id: `user-${Date.now()}` };
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    sendQueryToGemini(messageToSend);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ChatHeader sessionName={sessionName} />
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[0, 1, 2].map(i => (
            <Box key={i} sx={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end', gap: 1 }}>
              {i % 2 === 0 && <Skeleton variant="circular" width={30} height={30} />}
              <Skeleton variant="rounded" width={i % 2 === 0 ? '60%' : '50%'} height={56} sx={{ borderRadius: '16px' }} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ChatHeader sessionName={sessionName} />

      {/* Messages area */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        px: 2, py: 2,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {messages.length === 0 && !isAIThinking ? (
          <Box sx={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', gap: 2, opacity: 0.7,
            animation: 'fadeInUp 0.4s ease',
          }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '20px',
              background: isDark ? 'rgba(124,111,250,0.15)' : 'rgba(108,99,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px dashed ${theme.palette.primary.main}50`,
            }}>
              <SmartToyOutlinedIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>
                Start the conversation
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                Ask a question about your documents
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem', mt: 0.5, fontStyle: 'italic' }}>
                Try: "What are the main points in this document?"
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                onCopy={handleCopyMessage}
                onSpeak={handleSpeak}
                isSpeaking={isSpeaking}
              />
            ))}
            {isAIThinking && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      <ChatInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSend={handleSend}
        onKeyPress={handleKeyPress}
        disabled={isAIThinking}
      />
    </Box>
  );
}

export default Chat;
