import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, TextField, Typography, Button, InputAdornment, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useAuth } from '../AuthContext';
import { useNotification } from '../hooks/useNotification';

/* ─── Lerp helper ─────────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;

/* ─── Multi-layer fluid glow hook ────────────────────────────── */
// Each layer has its own lerp factor: lower = more lag = more fluid/floaty
function useFluidGlow(lerpFactor) {
  const posRef = useRef({ x: -999, y: -999 });      // current rendered position
  const targetRef = useRef({ x: -999, y: -999 });   // where mouse actually is
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const cx = posRef.current.x;
      const cy = posRef.current.y;
      const tx = targetRef.current.x;
      const ty = targetRef.current.y;

      const nx = lerp(cx, tx, lerpFactor);
      const ny = lerp(cy, ty, lerpFactor);

      // Only update state if moved more than 0.3px to avoid unnecessary renders
      if (Math.abs(nx - cx) > 0.3 || Math.abs(ny - cy) > 0.3) {
        posRef.current = { x: nx, y: ny };
        setPos({ x: nx, y: ny });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [lerpFactor]);

  const setTarget = useCallback((x, y) => {
    targetRef.current = { x, y };
  }, []);

  return [pos, setTarget];
}

/* ─── LoginPage ───────────────────────────────────────────────── */
function LoginPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Three independent layers, each tracking at different speeds
  const [slowPos,   setSlowTarget]   = useFluidGlow(0.035); // very lazy outer halo
  const [midPos,    setMidTarget]    = useFluidGlow(0.08);  // medium middle ring
  const [fastPos,   setFastTarget]   = useFluidGlow(0.18);  // snappy core dot

  // Single mouse move → update all three targets
  const handleMouseMove = useCallback((e) => {
    setSlowTarget(e.clientX, e.clientY);
    setMidTarget(e.clientX, e.clientY);
    setFastTarget(e.clientX, e.clientY);
  }, [setSlowTarget, setMidTarget, setFastTarget]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isRegistering) {
      if (password !== confirmPassword) { showError('Passwords do not match.'); return; }
      const result = await register(username, password);
      if (!result.success) showError(result.message);
      else {
        showSuccess('Registration successful! Please log in.');
        setIsRegistering(false); setUsername(''); setPassword(''); setConfirmPassword('');
      }
    } else {
      const result = await login(username, password);
      if (!result.success) showError(result.message);
      else showSuccess('Welcome back!');
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(82,183,136,0.04)',
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1.5 },
    },
  };

  const p = theme.palette.primary.main;
  const s = theme.palette.secondary.main;

  return (
    <Box
      onMouseMove={handleMouseMove}
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Static ambient bg */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: isDark
          ? `radial-gradient(ellipse 55% 50% at 15% 30%, ${p}12 0%, transparent 70%),
             radial-gradient(ellipse 45% 45% at 85% 70%, ${s}0C 0%, transparent 70%)`
          : `radial-gradient(ellipse 55% 50% at 15% 30%, ${p}0C 0%, transparent 70%),
             radial-gradient(ellipse 45% 45% at 85% 70%, ${s}08 0%, transparent 70%)`,
      }} />

      {/* Layer 1 — large slow halo (lerp 0.035) */}
      <Box sx={{
        position: 'absolute',
        left: slowPos.x - 350,
        top: slowPos.y - 350,
        width: 700,
        height: 700,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p}1C 0%, ${p}08 45%, transparent 70%)`,
        pointerEvents: 'none',
        willChange: 'left, top',
      }} />

      {/* Layer 2 — medium glow (lerp 0.08) */}
      <Box sx={{
        position: 'absolute',
        left: midPos.x - 140,
        top: midPos.y - 140,
        width: 280,
        height: 280,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p}2E 0%, ${p}10 55%, transparent 75%)`,
        pointerEvents: 'none',
        willChange: 'left, top',
      }} />

      {/* Layer 3 — tight bright core (lerp 0.18) */}
      <Box sx={{
        position: 'absolute',
        left: fastPos.x - 30,
        top: fastPos.y - 30,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p}55 0%, ${p}18 55%, transparent 80%)`,
        pointerEvents: 'none',
        filter: 'blur(4px)',
        willChange: 'left, top',
      }} />

      {/* Login card */}
      <Box sx={{
        width: 380,
        p: '36px 32px',
        borderRadius: '16px',
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: isDark
          ? `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${p}18`
          : `0 20px 60px rgba(82,183,136,0.12)`,
        position: 'relative',
        backdropFilter: 'blur(16px)',
        animation: 'fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 1,
      }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>

          <Typography sx={{
            fontWeight: 900, fontSize: '2.2rem', letterSpacing: '-0.04em',
            background: `linear-gradient(135deg, ${p} 0%, ${s} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5
          }}>
            AurenLM
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, mt: 0.5 }}>
            {isRegistering ? 'Create your account' : 'Sign in to continue'}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          <TextField
            required fullWidth id="username" label="Username" name="username"
            autoComplete="username" autoFocus value={username}
            onChange={e => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />
          <TextField
            required fullWidth name="password" label="Password" id="password"
            type={showPassword ? 'text' : 'password'} autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPassword(s => !s)} edge="end">
                    {showPassword
                      ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                      : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />
          {isRegistering && (
            <TextField
              required fullWidth name="confirmPassword" label="Confirm Password"
              type="password" id="confirmPassword" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />
          )}

          <Button
            type="submit" fullWidth variant="contained"
            sx={{ mt: 0.5, py: 1.3, borderRadius: '10px', fontSize: '0.875rem', fontWeight: 700 }}
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </Button>

          <Button
            fullWidth variant="text"
            onClick={() => setIsRegistering(s => !s)}
            sx={{
              fontSize: '0.78rem',
              color: theme.palette.text.secondary,
              '&:hover': { bgcolor: 'transparent', color: p },
            }}
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default LoginPage;
