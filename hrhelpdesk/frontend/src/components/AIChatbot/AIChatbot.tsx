import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Typography,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    Divider,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Switch,
    FormControlLabel,
    Tooltip,
    Menu,
    MenuItem,
    Avatar,
    Fade
} from '@mui/material';
import {
    SmartToy as BotIcon,
    Close as CloseIcon,
    Send as SendIcon,
    Language as LanguageIcon,
    Refresh as RefreshIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon,
    Help as HelpIcon,
    ExpandMore as ExpandMoreIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import './AIChatbot.css';

// Types
interface Message {
    id: string;
    type: 'user' | 'bot' | 'system';
    content: string;
    timestamp: Date;
    questionId?: number | null;
    status?: string;
    confidence?: number;
    sources?: Array<{
        url: string;
        section: string;
        score: number;
    }>;
}

interface CommonQuestion {
    id: string;
    text: string;
    category: string;
}

// API Configuration
const CHATBOT_API_URL = 'http://localhost:5000';

// Language options
const languageOptions = [
    {
        code: 'ar',
        name: 'العربية',
        flag: '🇪🇬',
        nativeName: 'العربية'
    },
    {
        code: 'en',
        name: 'English',
        flag: '🇺🇸',
        nativeName: 'English'
    }
];

const AIChatbot: React.FC = () => {
    // State
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<'ar' | 'en'>('ar');
    const [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]);
    const [feedback, setFeedback] = useState<{ [key: number]: 'up' | 'down' | null }>({});
    const [sessionId] = useState(() => `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`);
    const [error, setError] = useState<string | null>(null);
    const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize chat
    const initializeChat = useCallback(() => {
        const now = new Date();
        const welcomeMessage: Message = {
            id: 'welcome',
            type: 'bot',
            content: language === 'ar'
                ? 'مرحباً! أنا مساعدك الذكي لأسئلة قانون العمل المصري. كيف يمكنني مساعدتك اليوم؟'
                : 'Hello! I\'m your AI assistant for Egyptian Labour Law questions. How can I help you today?',
                timestamp: now
        };

        setMessages([welcomeMessage]);
        setError(null);
    }, [language]);

    // Fetch common questions
    const fetchCommonQuestions = useCallback(async () => {
        try {
            const response = await fetch(`${CHATBOT_API_URL}/common-questions?language=${language}`);
            if (response.ok) {
                const data = await response.json();
                setCommonQuestions(data.questions || []);
            }
        } catch (error) {
            console.error('Error fetching common questions:', error);
        }
    }, [language]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize when dialog opens
    useEffect(() => {
        if (isOpen) {
            initializeChat();
            fetchCommonQuestions();
        }
    }, [isOpen, initializeChat, fetchCommonQuestions]);

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Send message
    const sendMessage = async (content?: string, isCommonQuestion: boolean = false) => {
        const messageContent = content || inputValue.trim();
        if (!messageContent || isLoading) return;

        // Add user message
        const userMessage: Message = {
            id: `user_${Date.now()}`,
            type: 'user',
            content: messageContent,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${CHATBOT_API_URL}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: messageContent,
                    language,
                    session_id: sessionId,
                    is_common_question: isCommonQuestion
                })
            });

            if (response.ok) {
                const data = await response.json();
                const botMessage: Message = {
                    id: `bot_${Date.now()}`,
                    type: 'bot',
                    content: data.answers[0] || 'No response received',
                    timestamp: new Date(),
                    questionId: data.question_id,
                    status: data.status,
                    confidence: data.confidence_scores?.[0],
                    sources: data.rag_sources || []
                };

                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setError(
                language === 'ar'
                    ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.'
                    : 'Sorry, there was a connection error. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Handle feedback
    const handleFeedback = async (questionId: number, feedbackType: 'up' | 'down') => {
        const currentFeedback = feedback[questionId];
        const newFeedback = currentFeedback === feedbackType ? null : feedbackType;

        setFeedback(prev => ({
            ...prev,
            [questionId]: newFeedback
        }));

        if (questionId && newFeedback !== null) {
            try {
                await fetch(`${CHATBOT_API_URL}/feedback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        question_id: questionId,
                        is_good: newFeedback === 'up'
                    })
                });
            } catch (error) {
                console.error('Error sending feedback:', error);
            }
        }
    };

    // Handle key press
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    // Handle language menu
    const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setLanguageMenuAnchor(event.currentTarget);
    };

    const handleLanguageMenuClose = () => {
        setLanguageMenuAnchor(null);
    };

    const handleLanguageChange = (newLanguage: 'ar' | 'en') => {
        setLanguage(newLanguage);
        handleLanguageMenuClose();
    };

    // Get current language option
    const getCurrentLanguageOption = () => {
        return languageOptions.find(option => option.code === language) || languageOptions[0];
    };

    // Reset chat
    const resetChat = () => {
        setMessages([]);
        setFeedback({});
        setError(null);
        initializeChat();
    };

    // Render message
    const renderMessage = (message: Message) => {
        const isUser = message.type === 'user';
        const isRTL = language === 'ar' && !isUser;

        return (
            <Box
                key={message.id}
                sx={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    mb: 2,
                    direction: isRTL ? 'rtl' : 'ltr'
                }}
            >
                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor: isUser ? 'primary.main' : 'grey.100',
                        color: isUser ? 'white' : 'text.primary',
                        borderRadius: 2,
                        position: 'relative'
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            textAlign: isRTL ? 'right' : 'left'
                        }}
                    >
                        {message.content}
                    </Typography>

                    {/* Message metadata */}
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>

                        {message.confidence && (
                            <Chip
                                size="small"
                                label={`${(message.confidence * 100).toFixed(0)}% confidence`}
                                color={message.confidence > 0.7 ? 'success' : message.confidence > 0.4 ? 'warning' : 'error'}
                                variant="outlined"
                            />
                        )}

                        {message.status && (
                            <Chip
                                size="small"
                                label={message.status}
                                color={message.status === 'answered' ? 'success' : 'warning'}
                                variant="outlined"
                            />
                        )}
                    </Box>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                Sources:
                            </Typography>
                            {message.sources.map((source, index) => (
                                <Chip
                                    key={index}
                                    size="small"
                                    label={`${source.section} (${(source.score * 100).toFixed(0)}%)`}
                                    variant="outlined"
                                    sx={{ mr: 0.5, mt: 0.5 }}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Feedback buttons */}
                    {message.questionId && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                            <Tooltip title={language === 'ar' ? 'مفيد' : 'Helpful'}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleFeedback(message.questionId!, 'up')}
                                    sx={{
                                        color: feedback[message.questionId!] === 'up' ? 'success.main' : 'inherit',
                                        opacity: feedback[message.questionId!] === 'up' ? 1 : 0.5
                                    }}
                                >
                                    <ThumbUpIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={language === 'ar' ? 'غير مفيد' : 'Not helpful'}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleFeedback(message.questionId!, 'down')}
                                    sx={{
                                        color: feedback[message.questionId!] === 'down' ? 'error.main' : 'inherit',
                                        opacity: feedback[message.questionId!] === 'down' ? 1 : 0.5
                                    }}
                                >
                                    <ThumbDownIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Paper>
            </Box>
        );
    };

    return (
        <>
            {/* Floating Action Button */}
            <Fab
                color="primary"
                aria-label="AI Assistant"
                onClick={() => setIsOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000,
                    boxShadow: 3
                }}
            >
                <BotIcon />
            </Fab>

            {/* Chat Dialog */}
            <Dialog
                open={isOpen}
                onClose={() => setIsOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        height: '80vh',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
            >
            {/* Header */}
                <DialogTitle sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pb: 1
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BotIcon color="primary" />
                        <Typography variant="h6">
                            {language === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Modern Language Selector */}
                        <Tooltip title={language === 'ar' ? 'تغيير اللغة' : 'Change Language'}>
                            <Button
                                className="language-selector-button"
                                onClick={handleLanguageMenuOpen}
                                startIcon={
                                    <Box className="language-flag" sx={{ fontSize: '1.2rem' }}>
                                        {getCurrentLanguageOption().flag}
                                    </Box>
                                }
                                endIcon={<ExpandMoreIcon />}
                                variant="outlined"
                                size="small"
                                sx={{
                                    minWidth: 'auto',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    borderColor: 'primary.main',
                                    color: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: 'primary.50',
                                        borderColor: 'primary.dark'
                                    }
                                }}
                            >
                                {getCurrentLanguageOption().name}
                            </Button>
                        </Tooltip>

                        {/* Language Menu */}
                        <Menu
                            anchorEl={languageMenuAnchor}
                            open={Boolean(languageMenuAnchor)}
                            onClose={handleLanguageMenuClose}
                            TransitionComponent={Fade}
                            PaperProps={{
                                sx: {
                                    mt: 1,
                                    minWidth: 180,
                                    borderRadius: 2,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }
                            }}
                        >
                            {languageOptions.map((option) => (
                                <MenuItem
                                    key={option.code}
                                    className={`language-menu-item ${option.code === language ? 'selected' : ''}`}
                                    onClick={() => handleLanguageChange(option.code as 'ar' | 'en')}
                                    selected={option.code === language}
                                    sx={{
                                        py: 1.5,
                                        px: 2,
                                        '&.Mui-selected': {
                                            backgroundColor: 'primary.50',
                                            '&:hover': {
                                                backgroundColor: 'primary.100'
                                            }
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                        <Box className="language-flag" sx={{ fontSize: '1.3rem' }}>
                                            {option.flag}
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {option.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {option.nativeName}
                                            </Typography>
                                        </Box>
                                        {option.code === language && (
                                            <CheckIcon
                                                fontSize="small"
                                                sx={{ color: 'primary.main' }}
                                            />
                                        )}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Menu>

                        <Tooltip title={language === 'ar' ? 'إعادة تعيين المحادثة' : 'Reset Chat'}>
                            <IconButton onClick={resetChat} size="small">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        <IconButton onClick={() => setIsOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <Divider />

                {/* Content */}
                <DialogContent sx={{ flex: 1, p: 0, display: 'flex', flexDirection: 'column' }}>
                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ m: 2, mb: 0 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Messages */}
                    <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                        {messages.map(renderMessage)}

                        {/* Loading indicator */}
                        {isLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                <Paper elevation={2} sx={{ p: 2, backgroundColor: 'grey.100' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={16} />
                                        <Typography variant="body2">
                                            {language === 'ar' ? 'جاري البحث...' : 'Searching...'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                )}

                <div ref={messagesEndRef} />
                    </Box>

            {/* Common Questions */}
                    {commonQuestions.length > 0 && (
                        <Box sx={{ p: 2, pt: 0 }}>
                            <Typography variant="subtitle2" gutterBottom>
                    {language === 'ar' ? 'الأسئلة الشائعة:' : 'Common Questions:'}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {commonQuestions.slice(0, 6).map((question) => (
                                    <Chip
                            key={question.id}
                                        label={question.text}
                                        onClick={() => sendMessage(question.text, true)}
                                        variant="outlined"
                                        size="small"
                                        sx={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                <Divider />

            {/* Input */}
                <DialogActions sx={{ p: 2 }}>
                    <TextField
                        ref={inputRef}
                        fullWidth
                        multiline
                        maxRows={3}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            language === 'ar'
                                ? 'اكتب سؤالك هنا...'
                                : 'Type your question here...'
                        }
                        disabled={isLoading}
                        InputProps={{
                            endAdornment: (
                                <IconButton
                                    onClick={() => sendMessage()}
                                    disabled={!inputValue.trim() || isLoading}
                                    color="primary"
                                >
                                    <SendIcon />
                                </IconButton>
                            )
                        }}
                        sx={{
                            '& .MuiInputBase-input': {
                                direction: language === 'ar' ? 'rtl' : 'ltr',
                                textAlign: language === 'ar' ? 'right' : 'left'
                            }
                        }}
                    />
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AIChatbot;
