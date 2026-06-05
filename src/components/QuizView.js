import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Radio, RadioGroup, FormControlLabel,
  FormControl, FormLabel, Box, CircularProgress, Chip, LinearProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ReplayIcon from '@mui/icons-material/Replay';

const QuizView = ({ open, onClose, quizData, onSubmit, loading }) => {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (open) {
      setAnswers({});
      setResults(null);
      setSubmitted(false);
    }
  }, [open]);

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers({ ...answers, [questionIndex]: answer });
  };

  const handleSubmit = async () => {
    const resultData = await onSubmit(answers);
    if (resultData) {
      setResults(resultData);
      setSubmitted(true);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResults(null);
    setSubmitted(false);
  };

  if (!quizData) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: theme.palette.primary.main }} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  const scorePercent = results?.score ?? 0;
  const scoreColor = scorePercent >= 80
    ? theme.palette.primary.main   // green
    : scorePercent >= 50
      ? '#F0A500'                   // amber
      : theme.palette.secondary.main; // coral/red

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isDark
            ? '0 24px 80px rgba(0,0,0,0.6)'
            : '0 24px 80px rgba(82,183,136,0.12)',
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle sx={{
        pb: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '10px',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <EmojiEventsOutlinedIcon sx={{ fontSize: 18, color: isDark ? '#111' : '#fff' }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
            {quizData?.quiz_data?.title || 'Quiz'}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: theme.palette.text.secondary }}>
            {quizData?.quiz_data?.questions?.length || 0} questions · {quizData?.difficulty}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* ── Score Banner ── */}
        {submitted && results && (
          <Box sx={{
            mx: 0, px: 3, py: 2.5,
            background: isDark
              ? `linear-gradient(135deg, ${scoreColor}20, ${scoreColor}10)`
              : `linear-gradient(135deg, ${scoreColor}12, ${scoreColor}06)`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: scoreColor, lineHeight: 1 }}>
                  {results.score.toFixed(0)}%
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary, mt: 0.25 }}>
                  {results.correct_answers} out of {results.total_questions} correct
                </Typography>
              </Box>
              <Chip
                label={
                  scorePercent >= 80 ? '🎉 Excellent!' :
                  scorePercent >= 60 ? '👍 Good job' :
                  scorePercent >= 40 ? '📚 Keep studying' : '💪 Try again'
                }
                sx={{
                  fontWeight: 700, fontSize: '0.8rem',
                  bgcolor: `${scoreColor}20`,
                  color: scoreColor,
                  border: `1px solid ${scoreColor}40`,
                }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={results.score}
              sx={{
                height: 8, borderRadius: 4,
                bgcolor: `${scoreColor}20`,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}CC)`,
                },
              }}
            />
          </Box>
        )}

        {/* ── Questions ── */}
        <Box sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {quizData?.quiz_data?.questions?.map((q, index) => {
            const correctAnswer = results?.correct_answers_map?.[index];
            const userAnswer = answers[index];
            const isCorrect = submitted && results && correctAnswer === userAnswer;
            const isWrong = submitted && results && correctAnswer !== userAnswer && userAnswer;

            return (
              <Box
                key={index}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  border: `1px solid ${
                    isCorrect ? `${theme.palette.primary.main}60` :
                    isWrong   ? `${theme.palette.secondary.main}60` :
                    theme.palette.divider
                  }`,
                  bgcolor: isCorrect
                    ? isDark ? `${theme.palette.primary.main}10` : `${theme.palette.primary.main}06`
                    : isWrong
                      ? isDark ? `${theme.palette.secondary.main}10` : `${theme.palette.secondary.main}05`
                      : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                  <Box sx={{
                    width: 24, height: 24, borderRadius: '6px', flexShrink: 0,
                    bgcolor: isCorrect ? `${theme.palette.primary.main}25`
                           : isWrong  ? `${theme.palette.secondary.main}25`
                           : theme.palette.action.hover,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isCorrect ? <CheckCircleOutlineIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} /> :
                     isWrong   ? <CancelOutlinedIcon   sx={{ fontSize: 14, color: theme.palette.secondary.main }} /> :
                     <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: theme.palette.text.secondary }}>{index + 1}</Typography>}
                  </Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: theme.palette.text.primary, flex: 1 }}>
                    {q.question}
                  </Typography>
                </Box>

                <FormControl component="fieldset" disabled={submitted} sx={{ width: '100%' }}>
                  <RadioGroup
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                  >
                    {q.options.map((option, i) => {
                      const isCorrectOpt = submitted && option === correctAnswer;
                      const isWrongOpt   = submitted && option === userAnswer && option !== correctAnswer;

                      return (
                        <FormControlLabel
                          key={i}
                          value={option}
                          control={
                            <Radio
                              size="small"
                              sx={{
                                color: isCorrectOpt ? theme.palette.primary.main
                                     : isWrongOpt   ? theme.palette.secondary.main
                                     : theme.palette.text.secondary,
                                '&.Mui-checked': {
                                  color: isCorrectOpt ? theme.palette.primary.main
                                       : isWrongOpt   ? theme.palette.secondary.main
                                       : theme.palette.primary.main,
                                },
                              }}
                            />
                          }
                          label={
                            <Typography sx={{
                              fontSize: '0.83rem',
                              fontWeight: isCorrectOpt ? 600 : 400,
                              color: isCorrectOpt ? theme.palette.primary.main
                                   : isWrongOpt   ? theme.palette.secondary.main
                                   : theme.palette.text.primary,
                            }}>
                              {option}
                              {isCorrectOpt && submitted && (
                                <Typography component="span" sx={{ ml: 1, fontSize: '0.72rem', color: theme.palette.primary.main }}>
                                  ✓ Correct
                                </Typography>
                              )}
                            </Typography>
                          }
                          sx={{
                            my: 0.25, mx: 0,
                            px: 1, py: 0.5,
                            borderRadius: '8px',
                            bgcolor: isCorrectOpt
                              ? isDark ? `${theme.palette.primary.main}15` : `${theme.palette.primary.main}08`
                              : isWrongOpt
                                ? isDark ? `${theme.palette.secondary.main}15` : `${theme.palette.secondary.main}08`
                                : 'transparent',
                            transition: 'background 0.15s',
                            '&:hover': !submitted ? { bgcolor: theme.palette.action.hover } : {},
                          }}
                        />
                      );
                    })}
                  </RadioGroup>
                </FormControl>

                {/* Show correct answer hint if wrong */}
                {isWrong && correctAnswer && (
                  <Box sx={{
                    mt: 1, px: 1.5, py: 0.75, borderRadius: '8px',
                    bgcolor: `${theme.palette.primary.main}12`,
                    border: `1px solid ${theme.palette.primary.main}30`,
                  }}>
                    <Typography sx={{ fontSize: '0.75rem', color: theme.palette.primary.main }}>
                      ✓ Correct answer: <strong>{correctAnswer}</strong>
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>

      {/* ── Actions ── */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
          Close
        </Button>
        {submitted ? (
          <Button
            onClick={handleRetake}
            variant="outlined"
            startIcon={<ReplayIcon />}
            sx={{ borderRadius: '9px', fontWeight: 600 }}
          >
            Retake
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || Object.keys(answers).length === 0}
            sx={{ borderRadius: '9px', fontWeight: 600, minWidth: 100 }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : 'Submit Quiz'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuizView;