import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface SurveyTemplate {
    id: string;
    title: string;
    description: string;
    category: string;
    questions: TemplateQuestion[];
}

export interface TemplateQuestion {
    text: string;
    type: 'RATING_SCALE' | 'MULTIPLE_CHOICE' | 'TEXT';
    required: boolean;
    options?: string[];
    minValue?: number;
    maxValue?: number;
}

export interface Survey {
    id: string;
    title: string;
    description: string;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
    isAnonymous: boolean;
    startDate?: string;
    endDate?: string;
    questions: SurveyQuestion[];
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
}

export interface SurveyQuestion {
    id: string;
    text: string;
    type: 'RATING_SCALE' | 'MULTIPLE_CHOICE' | 'TEXT';
    required: boolean;
    order: number;
    options: string[];
    minValue?: number;
    maxValue?: number;
}

interface SurveyState {
    templates: SurveyTemplate[];
    surveys: Survey[];
    publishedSurveys: Survey[];
    loading: boolean;
    error: string | null;
}

const initialState: SurveyState = {
    templates: [],
    surveys: [],
    publishedSurveys: [],
    loading: false,
    error: null,
};

// Async thunks
export const fetchSurveyTemplates = createAsyncThunk(
    'survey/fetchTemplates',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/surveys/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch templates');
        }
    }
);

export const createSurveyFromTemplate = createAsyncThunk(
    'survey/createFromTemplate',
    async (surveyData: {
        templateId: string;
        title?: string;
        description?: string;
    }, { rejectWithValue }) => {
        try {
            console.log('Frontend: Creating survey with data:', surveyData);
            const token = localStorage.getItem('token');
            console.log('Frontend: Token exists:', !!token);

            const response = await axios.post(`${API_BASE_URL}/surveys`, surveyData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Frontend: Survey creation response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Frontend: Survey creation error:', error);
            console.error('Frontend: Error response:', error.response?.data);
            console.error('Frontend: Error status:', error.response?.status);
            return rejectWithValue(error.response?.data?.error || 'Failed to create survey');
        }
    }
);

export const fetchAllSurveys = createAsyncThunk(
    'survey/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            console.log('Frontend: Fetching all surveys...');
            const token = localStorage.getItem('token');
            console.log('Frontend: Token exists:', !!token);

            const response = await axios.get(`${API_BASE_URL}/surveys/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Frontend: All surveys response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Frontend: Fetch all surveys error:', error);
            console.error('Frontend: Error response:', error.response?.data);
            console.error('Frontend: Error status:', error.response?.status);
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch surveys');
        }
    }
);

export const fetchPublishedSurveys = createAsyncThunk(
    'survey/fetchPublished',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/surveys/published`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to fetch published surveys');
        }
    }
);

export const publishSurvey = createAsyncThunk(
    'survey/publish',
    async (surveyId: string, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_BASE_URL}/surveys/${surveyId}/publish`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to publish survey');
        }
    }
);

export const unpublishSurvey = createAsyncThunk(
    'survey/unpublish',
    async (surveyId: string, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_BASE_URL}/surveys/${surveyId}/unpublish`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to unpublish survey');
        }
    }
);

export const submitSurveyResponse = createAsyncThunk(
    'survey/submitResponse',
    async ({ surveyId, responses }: { surveyId: string; responses: any[] }, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_BASE_URL}/surveys/${surveyId}/responses`,
                { responses },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to submit response');
        }
    }
);

const surveySlice = createSlice({
    name: 'survey',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch templates
            .addCase(fetchSurveyTemplates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSurveyTemplates.fulfilled, (state, action) => {
                state.loading = false;
                state.templates = action.payload;
            })
            .addCase(fetchSurveyTemplates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create survey
            .addCase(createSurveyFromTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSurveyFromTemplate.fulfilled, (state, action) => {
                state.loading = false;
                state.surveys.unshift(action.payload);
            })
            .addCase(createSurveyFromTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch all surveys
            .addCase(fetchAllSurveys.fulfilled, (state, action) => {
                state.surveys = action.payload;
            })
            // Fetch published surveys
            .addCase(fetchPublishedSurveys.fulfilled, (state, action) => {
                state.publishedSurveys = action.payload;
            })
            // Publish survey
            .addCase(publishSurvey.fulfilled, (state, action) => {
                const index = state.surveys.findIndex(s => s.id === action.payload.id);
                if (index !== -1) {
                    state.surveys[index] = action.payload;
                }
            })
            // Unpublish survey
            .addCase(unpublishSurvey.fulfilled, (state, action) => {
                const index = state.surveys.findIndex(s => s.id === action.payload.id);
                if (index !== -1) {
                    state.surveys[index] = action.payload;
                }
            });
    },
});

export const { clearError } = surveySlice.actions;
export default surveySlice.reducer;
