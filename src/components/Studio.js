import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Paper, Typography, Box, IconButton, Tooltip, Button, Dialog, DialogContent, List, ListItem, ListItemText, Divider, Menu, MenuItem } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import ReactFlow, { addEdge, applyEdgeChanges, applyNodeChanges, Controls, Background, Handle, Position, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import { useNotification } from '../hooks/useNotification';
import QuizView from './QuizView'; 

const branchColorsDark = [
  '#5FD3A1', // Mint
  '#E07A5F', // Coral
  '#74C0FC', // Sky Blue
  '#F9A825', // Amber
  '#B39DDB', // Lavender
  '#F48FB1', // Pink
];

const branchColorsLight = [
  '#52B788', // Sage Green
  '#E07A5F', // Coral
  '#3B8ED0', // Blue
  '#F0A500', // Gold
  '#9575CD', // Lavender
  '#E91E8C', // Rose
];

// Custom Node Component for ReactFlow
const CustomMindmapNode = ({ id, data }) => {
  const { label, hasChildren, isCollapsed, onToggleCollapse, onNodeClick, branchColor, isDarkMode } = data;
  const theme = useTheme();
  
  // Use the color appropriate for the mode
  const nodeColor = branchColor;

  const handleNodeClick = useCallback((event) => {
    onNodeClick(event, { label, id });
  }, [onNodeClick, label, id]);

  return (
    <Box
      sx={{
        border: `2px solid ${nodeColor}`,
        borderRadius: '25px',
        padding: '12px 20px',
        backgroundColor: isDarkMode ? 'rgba(20, 20, 20, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        fontWeight: hasChildren ? 'bold' : 'normal',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.5s ease, border-color 0.5s ease',
        boxShadow: isDarkMode ? `0 0 12px ${nodeColor}33` : `0 2px 8px rgba(0,0,0,0.1)`,
        '&:hover': {
          transform: 'scale(1.08) translateY(-2px)',
          boxShadow: isDarkMode ? `0 0 25px ${nodeColor}88` : `0 4px 12px rgba(0,0,0,0.15)`,
          borderColor: isDarkMode ? '#fff' : nodeColor,
        },
      }}
      onClick={handleNodeClick}
    >
      <Handle type="target" position={Position.Left} style={{ background: nodeColor, border: 'none', width: '8px', height: '8px', transition: 'background-color 0.5s ease' }} />
      <Typography variant="body2" sx={{ mr: 1, color: isDarkMode ? '#fff' : '#202124', fontSize: '0.9rem', transition: 'color 0.5s ease' }}>{label}</Typography>
      {hasChildren && (
        <IconButton 
          size="small" 
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          sx={{ 
            color: nodeColor,
            transition: 'color 0.5s ease',
            '&:hover': { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          }}
        >
          {isCollapsed ? <AddCircleOutlineIcon fontSize="small" /> : <RemoveCircleOutlineIcon fontSize="small" />}
        </IconButton>
      )}
      <Handle type="source" position={Position.Right} style={{ background: nodeColor, border: 'none', width: '8px', height: '8px', transition: 'background-color 0.5s ease' }} />
    </Box>
  );
};

const MindmapFlow = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, nodeTypes, fullMindmapData, buildReactFlowElements, isMindmapFullscreen, setIsMindmapFullscreen, setNodes, setEdges }) => {
  const { fitView } = useReactFlow();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Effect to update existing nodes and edges when theme changes without rebuilding full structure
  useEffect(() => {
    const colors = isDarkMode ? branchColorsDark : branchColorsLight;
    
    setNodes((nds) =>
      nds.map((node) => {
        const branchIndex = node.data.branchIndex ?? 0;
        const newColor = colors[branchIndex % colors.length];

        return {
          ...node,
          data: {
            ...node.data,
            isDarkMode: isDarkMode,
            branchColor: newColor,
          },
        };
      })
    );

    setEdges((eds) =>
      eds.map((edge) => {
        // Find source node to get correct branch index for color
        const sourceNode = nodes.find(n => n.id === edge.source);
        const branchIndex = sourceNode?.data?.branchIndex ?? 0;
        const newColor = colors[branchIndex % colors.length];

        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: newColor,
            transition: 'stroke 0.5s ease, filter 0.5s ease',
            filter: isDarkMode ? `drop-shadow(0 0 5px ${newColor})` : 'none'
          },
        };
      })
    );
  }, [isDarkMode, setNodes, setEdges]);

  useEffect(() => {
    if (fullMindmapData) {
      const { rfNodes, rfEdges } = buildReactFlowElements(fullMindmapData);
      setNodes(rfNodes);
      setEdges(rfEdges);
    }
  }, [fullMindmapData, buildReactFlowElements, fitView, setNodes, setEdges]);

  useEffect(() => {
    const resizeHandler = () => {
      try {
        fitView({ duration: 400, padding: 0.2 });
      } catch (e) {
        console.warn("fitView warning suppressed:", e);
      }
    };

    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
    >
      <Controls />
      <Background 
        variant="dots" 
        gap={20} 
        size={1} 
        color={isDarkMode ? "#333" : "#ccc"} 
        style={{ backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa' }} 
      />
    </ReactFlow>
  );
};

function Studio({ isOpen, togglePanel, sessionPdfContent, onMindmapQuery, currentSessionId, initialMindmapData, documentId }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMindmap, setShowMindmap] = useState(false);
  const [fullMindmapData, setFullMindmapData] = useState(null);
  const [isMindmapFullscreen, setIsMindmapFullscreen] = useState(false);
  const { showError, showSuccess, showInfo } = useNotification();

  const [quizLoading, setQuizLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);

  const [quizOpen, setQuizOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [sessionNotes, setSessionNotes] = useState([]);

  // Global menu states
  const [quizMenuAnchor, setQuizMenuAnchor] = useState(null);
  const [notesMenuAnchor, setNotesMenuAnchor] = useState(null);

  // Node menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const nodeMenuOpen = Boolean(anchorEl);

  // Node menu sub-menu states
  const [nodeQuizMenuAnchor, setNodeQuizMenuAnchor] = useState(null);
  const [nodeNotesMenuAnchor, setNodeNotesMenuAnchor] = useState(null);

  const nodeTypes = useMemo(() => ({
    customMindmapNode: CustomMindmapNode,
  }), []);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClickHandler = useCallback((event, nodeData) => {
    setAnchorEl(event.currentTarget);
    setSelectedNode(nodeData);
  }, []);

  const handleNodeMenuClose = () => {
    setAnchorEl(null);
    setSelectedNode(null);
    setNodeQuizMenuAnchor(null);
    setNodeNotesMenuAnchor(null);
  };

  const handleGlobalQuizClick = (event) => setQuizMenuAnchor(event.currentTarget);
  const handleGlobalNotesClick = (event) => setNotesMenuAnchor(event.currentTarget);
  const handleGlobalMenuClose = () => {
    setQuizMenuAnchor(null);
    setNotesMenuAnchor(null);
  };

  const handleNodeQuizClick = (event) => setNodeQuizMenuAnchor(event.currentTarget);
  const handleNodeNotesClick = (event) => setNodeNotesMenuAnchor(event.currentTarget);

  const getRecursiveNodeContent = (node, labels = []) => {
    if (!node) return labels;
    labels.push(node.label);
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => getRecursiveNodeContent(child, labels));
    }
    return labels;
  };

  const handleAskAI = () => {
    if (!selectedNode) return;
    
    const clickedNode = findNodeInFullData(fullMindmapData, selectedNode.id, true);
    let parentNodeLabel = "";

    if (clickedNode && clickedNode.parentId) {
      const parentNode = findNodeInFullData(fullMindmapData, clickedNode.parentId, true);
      if (parentNode) {
        parentNodeLabel = parentNode.label;
      }
    }

    const query = `Discuss what these sources say about ${selectedNode.label}${parentNodeLabel ? `, in the larger context of ${parentNodeLabel}` : ""}`;
    
    if (isMindmapFullscreen) {
      setIsMindmapFullscreen(false);
    }
    
    onMindmapQuery(query);
    handleNodeMenuClose();
  };

  const handleNodeQuiz = async (difficulty) => {
    if (!selectedNode || !currentSessionId) return;
    
    const node = findNodeInFullData(fullMindmapData, selectedNode.id, true);
    const contentLabels = getRecursiveNodeContent(node);
    const contextText = `Generate a ${difficulty} difficulty quiz focusing on: ${contentLabels.join(", ")}. Use the main document as the source material.`;
    
    showInfo(`Generating ${difficulty} quiz for ${selectedNode.label}...`);
    handleNodeMenuClose();
    await handleGenerateQuiz(contextText, `Quiz (${difficulty}): ${selectedNode.label}`, difficulty);
  };

  const handleNodeNotes = async (style) => {
    if (!selectedNode || !currentSessionId) return;
    
    const node = findNodeInFullData(fullMindmapData, selectedNode.id, true);
    const contentLabels = getRecursiveNodeContent(node);
    const contextText = `Generate ${style} notes focusing on: ${contentLabels.join(", ")}. Use the main document as the source material.`;
    
    showInfo(`Generating ${style} notes for ${selectedNode.label}...`);
    handleNodeMenuClose();
    await handleGenerateSessionNotes(contextText, `Notes (${style}): ${selectedNode.label}`, style);
  };

  const findNodeInFullData = (data, identifier, searchById = false) => {
    if (!data) return null;
    let foundNode = null;
    const search = (nodesArray) => {
      for (const node of nodesArray) {
        if ((searchById && node.id === identifier) || (!searchById && node.label === identifier)) {
          foundNode = node;
          return;
        }
        if (node.children) {
          search(node.children);
        }
      }
    };
    search(data.nodes);
    return foundNode;
  };

  const toggleNodeCollapse = useCallback((nodeId) => {
    setFullMindmapData(prevData => {
      if (!prevData) return prevData;

      const newNodes = JSON.parse(JSON.stringify(prevData.nodes));
      const toggle = (nodesArray) => {
        for (const node of nodesArray) {
          if (node.id === nodeId) {
            node.isCollapsed = !node.isCollapsed;
            return true;
          }
          if (node.children && toggle(node.children)) {
            return true;
          }
        }
        return false;
      };

      toggle(newNodes);
      return { ...prevData, nodes: newNodes };
    });
  }, []);

  const buildReactFlowElements = useCallback((data) => {
    const rfNodes = [];
    const rfEdges = [];
    const nodeWidth = 250;
    const nodeHeight = 70;
    const horizontalGap = 50;
    const verticalGap = 30;
    const colors = isDarkMode ? branchColorsDark : branchColorsLight;

    const layoutTree = (node, x, y, level, parentId = null, parentIsCollapsed = false, branchColor = null, branchIndex = 0) => {
      if (!node) return 0;

      // Assign a color based on the top-level index if it's a root node
      let currentBranchColor = branchColor;
      
      const shouldRenderNode = !parentIsCollapsed;

      if (shouldRenderNode) {
        rfNodes.push({
          id: node.id,
          type: 'customMindmapNode',
          data: {
            label: node.label,
            hasChildren: node.children && node.children.length > 0,
            isCollapsed: node.isCollapsed,
            onToggleCollapse: () => toggleNodeCollapse(node.id),
            onNodeClick: onNodeClickHandler,
            branchColor: currentBranchColor,
            branchIndex: branchIndex, // Store index for color updates
            isDarkMode: isDarkMode,
          },
          position: { x: x, y: y },
        });

        if (parentId) {
          rfEdges.push({
            id: `${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            animated: true,
            style: { 
              stroke: currentBranchColor, 
              strokeWidth: 3,
              filter: isDarkMode ? `drop-shadow(0 0 5px ${currentBranchColor})` : 'none'
            },
          });
        }
      }

      let currentY = y + nodeHeight + verticalGap;
      let totalChildrenHeight = 0;

      if (node.children && !node.isCollapsed) {
        node.children.forEach(child => {
          const childHeight = layoutTree(child, x + nodeWidth + horizontalGap, currentY, level + 1, node.id, node.isCollapsed, currentBranchColor, branchIndex);
          currentY += childHeight;
          totalChildrenHeight += childHeight;
        });
      }

      return shouldRenderNode ? Math.max(nodeHeight + verticalGap, totalChildrenHeight) : 0;
    };

    if (data && data.nodes) {
      let currentYOffset = 0;
      data.nodes.forEach((node, index) => {
        const color = colors[index % colors.length];
        const branchHeight = layoutTree(node, 0, currentYOffset, 0, null, false, color, index);
        currentYOffset += branchHeight;
      });
    }
    return { rfNodes, rfEdges };
  }, [onNodeClickHandler, toggleNodeCollapse, isDarkMode]);

  useEffect(() => {
    if (fullMindmapData) {
      const { rfNodes, rfEdges } = buildReactFlowElements(fullMindmapData);
      setNodes(rfNodes);
      setEdges(rfEdges);
    }
  }, [fullMindmapData, buildReactFlowElements]);

  useEffect(() => {
    if (initialMindmapData) {
      setFullMindmapData(initialMindmapData);
    } else {
      setFullMindmapData(null);
      setShowMindmap(false);
    }
  }, [initialMindmapData]);

  const generateMindmap = async () => {
    if (!currentSessionId) {
      showError("Please select or create a session first.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/generate-mindmap', {
        fullText: sessionPdfContent,
        session_id: currentSessionId,
      }, { withCredentials: true, timeout: 120000 });

      const mindmapData = response.data;
      const initializeCollapseState = (nodesArray, level = 0, parentId = null) => {
        nodesArray.forEach(node => {
          node.isCollapsed = level > 0;
          node.parentId = parentId;
          if (node.children) {
            initializeCollapseState(node.children, level + 1, node.id);
          }
        });
      };
      initializeCollapseState(mindmapData.nodes);
      setFullMindmapData(mindmapData);
      setShowMindmap(true);
      showSuccess('Mind map generated successfully!');

    } catch (error) {
      console.error("Error generating mind map:", error);
      showError('An error occurred while generating the mind map.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async (customText = null, customTitle = null, difficulty = 'Normal') => {
    if (!currentSessionId) {
      showError("Please select a session first.");
      return;
    }
    setQuizLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/sessions/${currentSessionId}/generate_quiz`, 
        { 
          difficulty: difficulty,
          custom_text: customText,
          custom_title: customTitle
        },
        { withCredentials: true }
      );
      setCurrentQuiz(response.data);
      setQuizOpen(true);
      showSuccess("Quiz generated successfully!");
      fetchQuizHistory(); // Refresh history
    } catch (error) {
      console.error("Error generating quiz:", error);
      showError("Failed to generate quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  const fetchQuizHistory = useCallback(async () => {
    if (currentSessionId) {
      try {
        const response = await axios.get(`http://localhost:5000/api/sessions/${currentSessionId}/quizzes`, { withCredentials: true });
        setQuizHistory(response.data);
      } catch (error) {
        console.error("Error fetching quiz history:", error);
      }
    }
  }, [currentSessionId]);

  const fetchSessionNotes = useCallback(async () => {
    if (currentSessionId) {
      try {
        const response = await axios.get(`http://localhost:5000/api/sessions/${currentSessionId}/notes`, { withCredentials: true });
        setSessionNotes(response.data);
      } catch (error) {
        console.error("Error fetching session notes:", error);
      }
    }
  }, [currentSessionId]);

  const handleDownloadNote = async (note) => {
    if (!note.pdf_url) {
      showError('No notes file available.');
      return;
    }
    try {
      showInfo('Opening notes…');
      const response = await axios.get(note.pdf_url, {
        withCredentials: true,
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      showSuccess('Notes opened!');
    } catch (error) {
      console.error('Error opening note:', error);
      const status = error.response?.status;
      if (status === 404) {
        showError('Notes file not found on server. Please regenerate the notes.');
      } else if (status === 401 || status === 403) {
        showError('Session expired. Please log in again.');
      } else {
        showError('Failed to open notes. Please try again.');
      }
    }
  };

  useEffect(() => {
    fetchQuizHistory();
    fetchSessionNotes();
  }, [fetchQuizHistory, fetchSessionNotes]);

  const handleGenerateSessionNotes = async (customText = null, customTitle = null, style = 'concise') => {
    if (!currentSessionId) {
      showError("Please select a session first.");
      return;
    }
    if (!sessionPdfContent && !customText) {
      showError("No document content available in this session to generate notes from.");
      return;
    }
    setNotesLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/sessions/${currentSessionId}/generate_notes`, 
        { 
          style: style,
          custom_text: customText,
          custom_title: customTitle
        },
        { withCredentials: true, timeout: 120000 }
      );
      showSuccess("Session notes generated successfully!");
      fetchSessionNotes(); // Refresh session notes
    } catch (error) {
      console.error("Error generating session notes:", error);
      showError("Failed to generate session notes.");
    } finally {
      setNotesLoading(false);
    }
  };

  const handleQuizSubmit = async (answers) => {
    if (!currentQuiz) return;

    setQuizLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/quizzes/${currentQuiz.id}/submit`, 
        { answers },
        { withCredentials: true }
      );
      showSuccess(`Quiz submitted! Score: ${response.data.score.toFixed(0)}%`);
      fetchQuizHistory(); // Refresh so score appears in history
      return response.data;
    } catch (error) {
      console.error("Error submitting quiz:", error);
      showError("Failed to submit quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  // ── Studio Tab State ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState('mindmap');

  const tabConfig = [
    { id: 'mindmap', label: 'Mind Map', icon: '🗺' },
    { id: 'notes',   label: 'Notes',    icon: '📝' },
    { id: 'quiz',    label: 'Quiz',     icon: '❓' },
  ];

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Studio Header ── */}
      <Box sx={{
        px: 2, py: 1.25,
        display: 'flex', alignItems: 'center', gap: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
      }}>
        <Box sx={{ fontSize: '0.9rem' }}>🎓</Box>
        <Typography sx={{
          fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: theme.palette.text.secondary, flex: 1,
        }}>
          Studio
        </Typography>
      </Box>

      {/* ── Tab Bar ── */}
      <Box sx={{
        display: 'flex',
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
        px: 1, pt: 0.75,
        gap: 0.25,
      }}>
        {tabConfig.map(tab => (
          <Box
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            sx={{
              flex: 1, textAlign: 'center', py: 0.875,
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id
                ? `2px solid ${theme.palette.primary.main}`
                : '2px solid transparent',
              color: activeTab === tab.id ? theme.palette.primary.main : theme.palette.text.secondary,
              background: activeTab === tab.id
                ? theme.palette.action.selected
                : 'transparent',
              transition: 'all 0.18s ease',
              '&:hover': {
                color: theme.palette.primary.main,
                background: theme.palette.action.hover,
              },
            }}
          >
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
              {tab.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ── Tab Content ── */}
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

        {/* Mind Map Tab */}
        {activeTab === 'mindmap' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, minHeight: 0 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => generateMindmap()}
              disabled={loading || !sessionPdfContent}
              size="small"
              sx={{ borderRadius: '10px', py: 1 }}
            >
              {loading ? 'Generating…' : '🗺 Generate Mind Map'}
            </Button>

            {fullMindmapData && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={showMindmap ? 'contained' : 'outlined'}
                  size="small"
                  sx={{ flex: 1, borderRadius: '8px', fontSize: '0.75rem' }}
                  onClick={() => setShowMindmap(!showMindmap)}
                >
                  {showMindmap ? 'Hide' : 'Show'}
                </Button>
                {showMindmap && (
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ flex: 1, borderRadius: '8px', fontSize: '0.75rem' }}
                    onClick={() => setIsMindmapFullscreen(true)}
                    startIcon={<FullscreenIcon sx={{ fontSize: 14 }} />}
                  >
                    Full
                  </Button>
                )}
              </Box>
            )}

            {showMindmap && fullMindmapData ? (
              <Box sx={{
                width: '100%',
                flex: 1,
                minHeight: 280,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '10px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <ReactFlowProvider>
                  <MindmapFlow
                    nodes={nodes} edges={edges}
                    onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                    onConnect={onConnect} nodeTypes={nodeTypes}
                    fullMindmapData={fullMindmapData} buildReactFlowElements={buildReactFlowElements}
                    isMindmapFullscreen={isMindmapFullscreen} setIsMindmapFullscreen={setIsMindmapFullscreen}
                    setNodes={setNodes} setEdges={setEdges}
                  />
                </ReactFlowProvider>
              </Box>
            ) : !fullMindmapData ? (
              <Box sx={{
                textAlign: 'center', py: 4, px: 2,
                border: `1px dashed ${theme.palette.divider}`, borderRadius: '12px', opacity: 0.6,
              }}>
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>🗺</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary }}>
                  Mind Map will appear here for the current session.
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, mt: 0.5 }}>
                  (Generated from documents)
                </Typography>
              </Box>
            ) : null}
          </Box>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, animation: 'fadeInUp 0.2s ease' }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleGlobalNotesClick}
              disabled={notesLoading || !sessionPdfContent}
              size="small"
              sx={{ borderRadius: '10px', py: 1 }}
            >
              {notesLoading ? 'Generating…' : '📝 Generate Notes'}
            </Button>
            <Menu anchorEl={notesMenuAnchor} open={Boolean(notesMenuAnchor)} onClose={handleGlobalMenuClose}>
              <MenuItem onClick={() => { handleGenerateSessionNotes(null, null, 'concise'); handleGlobalMenuClose(); }}>Concise</MenuItem>
              <MenuItem onClick={() => { handleGenerateSessionNotes(null, null, 'detailed'); handleGlobalMenuClose(); }}>Detailed</MenuItem>
              <MenuItem onClick={() => { handleGenerateSessionNotes(null, null, 'bullet points'); handleGlobalMenuClose(); }}>Bullet Points</MenuItem>
            </Menu>

            {sessionNotes.length > 0 ? (
              <List dense disablePadding>
                {sessionNotes.map((note) => (
                  <ListItem
                    key={note.id}
                    button
                    onClick={() => handleDownloadNote(note)}
                    sx={{
                      borderRadius: '10px', mb: 0.5,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': { bgcolor: theme.palette.action.hover },
                    }}
                  >
                    <ListItemText
                      primary={<Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{note.title || `Notes — ${new Date(note.created_at).toLocaleDateString()}`}</Typography>}
                      secondary={<Typography sx={{ fontSize: '0.68rem', color: theme.palette.primary.main }}>↗ Open Notes</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{
                textAlign: 'center', py: 4, px: 2,
                border: `1px dashed ${theme.palette.divider}`, borderRadius: '12px', opacity: 0.6,
              }}>
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>📝</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary }}>
                  No notes generated yet.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, animation: 'fadeInUp 0.2s ease' }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleGlobalQuizClick}
              disabled={quizLoading || !documentId}
              size="small"
              sx={{ borderRadius: '10px', py: 1 }}
            >
              {quizLoading ? 'Generating…' : '❓ Generate Quiz'}
            </Button>
            <Menu anchorEl={quizMenuAnchor} open={Boolean(quizMenuAnchor)} onClose={handleGlobalMenuClose}>
              <MenuItem onClick={() => { handleGenerateQuiz(null, null, 'Easy'); handleGlobalMenuClose(); }}>Easy</MenuItem>
              <MenuItem onClick={() => { handleGenerateQuiz(null, null, 'Normal'); handleGlobalMenuClose(); }}>Normal</MenuItem>
              <MenuItem onClick={() => { handleGenerateQuiz(null, null, 'Hard'); handleGlobalMenuClose(); }}>Hard</MenuItem>
            </Menu>

            {quizHistory.length > 0 ? (
              <List dense disablePadding>
                {quizHistory.map((quiz) => (
                  <ListItem
                    key={quiz.id}
                    button
                    onClick={() => { setCurrentQuiz(quiz); setQuizOpen(true); }}
                    sx={{
                      borderRadius: '10px', mb: 0.5,
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': { bgcolor: theme.palette.action.hover },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {quiz.quiz_data.title || `Quiz — ${new Date(quiz.generated_at).toLocaleDateString()}`}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                          <Typography component="span" sx={{ fontSize: '0.68rem', color: theme.palette.text.secondary }}>
                            {quiz.difficulty}
                          </Typography>
                          {quiz.score != null && (
                            <Box component="span" sx={{
                              fontSize: '0.68rem', fontWeight: 700, px: 0.75, py: 0.2,
                              borderRadius: '5px',
                              bgcolor: quiz.score >= 80
                                ? `${theme.palette.primary.main}22`
                                : quiz.score >= 50
                                  ? 'rgba(240,165,0,0.15)'
                                  : `${theme.palette.secondary.main}18`,
                              color: quiz.score >= 80
                                ? theme.palette.primary.main
                                : quiz.score >= 50
                                  ? '#F0A500'
                                  : theme.palette.secondary.main,
                            }}>
                              {quiz.score.toFixed(0)}%
                            </Box>
                          )}
                          {quiz.score == null && (
                            <Box component="span" sx={{
                              fontSize: '0.65rem', px: 0.75, py: 0.2,
                              borderRadius: '5px',
                              bgcolor: theme.palette.action.hover,
                              color: theme.palette.text.secondary,
                            }}>
                              Not attempted
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{
                textAlign: 'center', py: 4, px: 2,
                border: `1px dashed ${theme.palette.divider}`, borderRadius: '12px', opacity: 0.6,
              }}>
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>❓</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.78rem', color: theme.palette.text.secondary }}>
                  No quizzes generated yet.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Use tabs hint */}
      <Box sx={{
        px: 2, py: 1,
        borderTop: `1px solid ${theme.palette.divider}`,
        display: 'flex', alignItems: 'flex-start', gap: 1,
        flexShrink: 0,
      }}>
        <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary, lineHeight: 1.4 }}>
          ℹ Use the tabs above to switch between Mind Map, Notes, and Quiz.
        </Typography>
      </Box>

      {/* Context Menus for mindmap nodes */}
      <Menu anchorEl={anchorEl} open={nodeMenuOpen} onClose={handleNodeMenuClose}>
        <MenuItem onClick={handleAskAI}>Ask AI</MenuItem>
        <MenuItem onClick={handleNodeQuizClick}>Gen Quiz ▶</MenuItem>
        <MenuItem onClick={handleNodeNotesClick}>Gen Notes ▶</MenuItem>
      </Menu>
      <Menu anchorEl={nodeQuizMenuAnchor} open={Boolean(nodeQuizMenuAnchor)} onClose={() => setNodeQuizMenuAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={() => handleNodeQuiz('Easy')}>Easy</MenuItem>
        <MenuItem onClick={() => handleNodeQuiz('Normal')}>Normal</MenuItem>
        <MenuItem onClick={() => handleNodeQuiz('Hard')}>Hard</MenuItem>
      </Menu>
      <Menu anchorEl={nodeNotesMenuAnchor} open={Boolean(nodeNotesMenuAnchor)} onClose={() => setNodeNotesMenuAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <MenuItem onClick={() => handleNodeNotes('concise')}>Concise</MenuItem>
        <MenuItem onClick={() => handleNodeNotes('detailed')}>Detailed</MenuItem>
        <MenuItem onClick={() => handleNodeNotes('bullet points')}>Bullet Points</MenuItem>
      </Menu>

      {/* Fullscreen mindmap dialog */}
      <Dialog fullScreen open={isMindmapFullscreen} onClose={() => setIsMindmapFullscreen(false)}>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={() => setIsMindmapFullscreen(false)}>
              <FullscreenExitIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }}>
            <ReactFlowProvider>
              <MindmapFlow
                nodes={nodes} edges={edges}
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                onConnect={onConnect} nodeTypes={nodeTypes}
                fullMindmapData={fullMindmapData} buildReactFlowElements={buildReactFlowElements}
                isMindmapFullscreen={isMindmapFullscreen} setIsMindmapFullscreen={setIsMindmapFullscreen}
                setNodes={setNodes} setEdges={setEdges}
              />
            </ReactFlowProvider>
          </Box>
        </DialogContent>
      </Dialog>

      <QuizView
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        quizData={currentQuiz}
        onSubmit={handleQuizSubmit}
        loading={quizLoading}
      />
    </Box>
  );
}

export default Studio;