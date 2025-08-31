import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio,
    Rating,
    Alert,
    Divider,
    Paper
} from '@mui/material';
import { Assignment, Star } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { fetchPublishedSurveys, submitSurveyResponse } from '../../store/surveySlice';

const SurveyList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { publishedSurveys, loading, error } = useSelector((state: RootState) => state.survey);

    const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        dispatch(fetchPublishedSurveys());
    }, [dispatch]);

    const handleStartSurvey = (survey: any) => {
        setSelectedSurvey(survey);
        setResponses({});
        setSubmitSuccess(false);
    };

    const handleResponseChange = (questionId: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async () => {
        if (!selectedSurvey) return;

        const responseArray = selectedSurvey.questions.map((question: any) => ({
            questionId: question.id,
            value: responses[question.id] || ''
        }));

        setSubmitting(true);

        try {
            const result = await dispatch(submitSurveyResponse({
                surveyId: selectedSurvey.id,
                responses: responseArray
            }));

            if (submitSurveyResponse.fulfilled.match(result)) {
                setSubmitSuccess(true);
                // Refresh published surveys to update status
                dispatch(fetchPublishedSurveys());
            }
        } catch (error) {
            console.error('Survey submission error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedSurvey(null);
        setResponses({});
        setSubmitSuccess(false);
    };

    const isComplete = selectedSurvey?.questions.every((q: any) =>
        responses[q.id] !== undefined && responses[q.id] !== ''
    );

    const renderQuestionInput = (question: any) => {
        switch (question.type) {
            case 'RATING_SCALE':
                return (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Rate from {question.minValue} (worst) to {question.maxValue} (best)
                        </Typography>
                        <Rating
                            value={parseInt(responses[question.id]) || 0}
                            onChange={(_, value) => handleResponseChange(question.id, value)}
                            max={question.maxValue || 5}
                            size="large"
                            icon={<Star fontSize="inherit" />}
                            emptyIcon={<Star fontSize="inherit" />}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                {question.minValue} - Worst
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {question.maxValue} - Best
                            </Typography>
                        </Box>
                    </Box>
                );
            case 'MULTIPLE_CHOICE':
                return (
                    <RadioGroup
                        value={responses[question.id] || ''}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        sx={{ mt: 2 }}
                    >
                        {question.options.map((option: string, index: number) => (
                            <FormControlLabel
                                key={index}
                                value={option}
                                control={<Radio />}
                                label={option}
                            />
                        ))}
                    </RadioGroup>
                );
            default:
                return null;
        }
    };

    if (submitSuccess) {
        return (
            <Dialog open={true} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <Assignment sx={{ fontSize: 60, color: '#00B59D', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Thank You!
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Your survey response has been submitted successfully.
                        Your feedback helps us improve the workplace experience.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} variant="contained" sx={{ bgcolor: '#00B59D' }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Available Surveys
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {publishedSurveys.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Assignment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No surveys available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Check back later for new surveys from HR.
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                    gap: 3
                }}>
                    {publishedSurveys.map((survey) => (
                        <Card key={survey.id}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {survey.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {survey.description}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {survey.questions.length} questions • Estimated time: {Math.ceil(survey.questions.length * 0.5)} minutes
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={() => handleStartSurvey(survey)}
                                    sx={{ bgcolor: '#00B59D' }}
                                    fullWidth
                                >
                                    Take Survey
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}

            {/* Survey Dialog */}
            <Dialog
                open={!!selectedSurvey}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                scroll="body"
            >
                {selectedSurvey && (
                    <>
                        <DialogTitle>
                            <Typography variant="h5">{selectedSurvey.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedSurvey.description}
                            </Typography>
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ py: 2 }}>
                                {selectedSurvey.questions.map((question: any, index: number) => (
                                    <Box key={question.id} sx={{ mb: 4 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {index + 1}. {question.text}
                                            {question.required && (
                                                <Typography component="span" color="error">
                                                    *
                                                </Typography>
                                            )}
                                        </Typography>
                                        {renderQuestionInput(question)}
                                        {index < selectedSurvey.questions.length - 1 && (
                                            <Divider sx={{ mt: 3 }} />
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 3 }}>
                            <Button onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                variant="contained"
                                sx={{ bgcolor: '#00B59D' }}
                                disabled={!isComplete || submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Survey'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default SurveyList;
