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
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Alert,
    FormControlLabel,
    Switch
} from '@mui/material';
import { Add, Launch, BarChart, Poll } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import {
    fetchSurveyTemplates,
    createSurveyFromTemplate,
    fetchAllSurveys,
    publishSurvey,
    unpublishSurvey
} from '../../store/surveySlice';

const SurveyManagement: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { templates, surveys, loading, error } = useSelector((state: RootState) => state.survey);

    const [open, setOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });

    useEffect(() => {
        console.log('SurveyManagement: Component mounted, fetching templates and surveys...');
        dispatch(fetchSurveyTemplates());
        dispatch(fetchAllSurveys());
    }, [dispatch]);

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setFormData({
                ...formData,
                title: template.title,
                description: template.description
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await dispatch(createSurveyFromTemplate({
            templateId: selectedTemplate,
            ...formData
        }));

        if (createSurveyFromTemplate.fulfilled.match(result)) {
            setOpen(false);
            setFormData({ title: '', description: '' });
            setSelectedTemplate('');
            dispatch(fetchAllSurveys());
        }
    };

    const handlePublish = async (surveyId: string) => {
        if (window.confirm('Are you sure you want to publish this survey? Employees will be able to see and respond to it.')) {
            await dispatch(publishSurvey(surveyId));
            dispatch(fetchAllSurveys());
        }
    };

    const handleUnpublish = async (surveyId: string) => {
        if (window.confirm('Are you sure you want to unpublish this survey? It will be removed from employees view.')) {
            await dispatch(unpublishSurvey(surveyId));
            dispatch(fetchAllSurveys());
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PUBLISHED': return 'success';
            case 'DRAFT': return 'warning';
            case 'CLOSED': return 'error';
            default: return 'default';
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" component="h2">
                        <Poll sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Survey Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpen(true)}
                        sx={{ bgcolor: '#00B59D' }}
                    >
                        Create Survey
                    </Button>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Responses</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {surveys.map((survey) => (
                                <TableRow key={survey.id}>
                                    <TableCell>
                                        <Typography variant="subtitle2">{survey.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {survey.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={survey.status}
                                            color={getStatusColor(survey.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {(survey as any).responses?.length || 0}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(survey.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {survey.status === 'DRAFT' ? (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                startIcon={<Launch />}
                                                onClick={() => handlePublish(survey.id)}
                                                sx={{ mr: 1, bgcolor: '#00B59D' }}
                                            >
                                                Publish
                                            </Button>
                                        ) : (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleUnpublish(survey.id)}
                                                sx={{ mr: 1 }}
                                            >
                                                Unpublish
                                            </Button>
                                        )}
                                        <IconButton size="small" color="primary">
                                            <BarChart />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Create Survey Dialog */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle>Create New Survey</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Survey Template</InputLabel>
                                    <Select
                                        value={selectedTemplate}
                                        onChange={(e) => handleTemplateChange(e.target.value)}
                                        label="Survey Template"
                                    >
                                        {templates.map((template) => (
                                            <MenuItem key={template.id} value={template.id}>
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {template.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {template.category} • {template.questions.length} questions
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    label="Survey Title"
                                    fullWidth
                                    variant="outlined"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />

                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    variant="outlined"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ bgcolor: '#00B59D' }}
                                disabled={loading || !selectedTemplate}
                            >
                                {loading ? 'Creating...' : 'Create Survey'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default SurveyManagement;
