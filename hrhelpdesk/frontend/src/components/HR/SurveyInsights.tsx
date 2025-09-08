import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Star, Target, Award, TrendingUp as Growth, RefreshCw } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { processSurveyData, calculateEngagementMetrics, ProcessedSurveyData } from '../../utils/surveyDataProcessor';

// Get real survey data from CSV
const realSurveyData = processSurveyData();

const COLORS = ['#5A2D82', '#7B4397', '#C4A484', '#00B59D', '#008B7A'];

interface ChartCardProps {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, icon, children }) => (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 2, color: '#5A2D82' }}>
                    {icon}
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#5A2D82' }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Box>
            {children}
        </CardContent>
    </Card>
);

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({
    title,
    value,
    icon,
    color,
}) => (
    <Paper
        sx={{
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${color}15, ${color}05)`,
            border: `1px solid ${color}20`,
            position: 'relative',
            overflow: 'hidden',
        }}
    >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ color, mr: 1 }}>
                    {icon}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {title}
                </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color }}>
                {value}
            </Typography>
        </Box>
        <Box
            sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                opacity: 0.1,
                transform: 'scale(1.5)',
                color,
            }}
        >
            {icon}
        </Box>
    </Paper>
);

const ScoreCard: React.FC<{
    title: string;
    value: number;
    total: number;
    color: string;
    subtitle?: string;
    icon?: React.ReactNode;
}> = ({ title, value, total, color, subtitle, icon }) => {
    const percentage = Math.round((value / total) * 100);

    return (
        <Paper
            sx={{
                p: 2.5,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                border: `2px solid ${color}30`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 25px ${color}30`,
                }
            }}
        >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {title}
                    </Typography>
                    {icon && (
                        <Box sx={{ color, opacity: 0.7 }}>
                            {icon}
                        </Box>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        / {total}
                    </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color }}>
                    {percentage}%
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    opacity: 0.1,
                    transform: 'scale(1.2)',
                    color,
                }}
            >
                {icon}
            </Box>
        </Paper>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {label}
                </Typography>
                <Typography variant="body2" color="primary">
                    Count: {payload[0].value}
                </Typography>
            </Paper>
        );
    }
    return null;
};

const SurveyInsights: React.FC = () => {
    const { user, token } = useSelector((state: RootState) => state.auth);
    const [surveyData, setSurveyData] = useState<ProcessedSurveyData>(realSurveyData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Fetch data from API (optional - using real data by default)
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            // For now, we'll use the real survey data from CSV
            // In the future, this could fetch from an API
            setSurveyData(realSurveyData);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setSurveyData(realSurveyData);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [user, token]); // Re-run when user or token changes

    // Calculate engagement metrics using real data
    const metrics = calculateEngagementMetrics(surveyData);
    const { engagementScore, satisfactionScore, growthScore } = metrics;

    // Show loading state
    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    Loading survey insights...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 0 }}>
            {/* Header with refresh button */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#5A2D82', mb: 1 }}>
                        Survey Insights Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Real employee engagement analytics from survey data
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshCw size={16} />}
                    onClick={fetchData}
                    disabled={loading}
                    sx={{
                        borderColor: '#5A2D82',
                        color: '#5A2D82',
                        '&:hover': { borderColor: '#7B4397', backgroundColor: '#5A2D8210' }
                    }}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
            </Box>


            {/* Key Metrics */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 3,
                mb: 4
            }}>
                <StatCard
                    title="Total Responses"
                    value={surveyData.totalResponses}
                    icon={<Users size={24} />}
                    color="#5A2D82"
                />
                <StatCard
                    title="Engagement Score"
                    value={`${engagementScore}%`}
                    icon={<TrendingUp size={24} />}
                    color="#00B59D"
                />
                <StatCard
                    title="Satisfaction Rate"
                    value={`${satisfactionScore}%`}
                    icon={<Star size={24} />}
                    color="#7B4397"
                />
                <StatCard
                    title="Growth Opportunities"
                    value={`${growthScore}%`}
                    icon={<Growth size={24} />}
                    color="#C4A484"
                />
            </Box>

            {/* Charts Grid */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
                gap: 3
            }}>
                {/* Role Clarity */}
                <ChartCard
                    title="Role & Responsibility Clarity"
                    subtitle="I clearly understand my role, responsibilities, and performance expectations"
                    icon={<Target size={20} />}
                >
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={surveyData.question1Data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#5A2D82" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Collaboration Rating */}
                <ChartCard
                    title="Collaboration & Teamwork"
                    subtitle="Overall collaboration and teamwork within the company"
                    icon={<Users size={20} />}
                >
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2 }}>
                        {surveyData.question5Data.map((item, index) => (
                            <ScoreCard
                                key={item.name}
                                title={item.name}
                                value={item.value}
                                total={surveyData.totalResponses}
                                color={item.color}
                                subtitle="responses"
                                icon={<Users size={16} />}
                            />
                        ))}
                    </Box>
                </ChartCard>

                {/* Manager Feedback */}
                <ChartCard
                    title="Manager Support"
                    subtitle="Manager provides constructive feedback and supports professional growth"
                    icon={<Award size={20} />}
                >
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={surveyData.question7Data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#00B59D" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Leadership Trust */}
                <ChartCard
                    title="Leadership Trust"
                    subtitle="Trust in leadership team to make decisions in best interest"
                    icon={<Star size={20} />}
                >
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={surveyData.question8Data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#7B4397" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Career Growth */}
                <ChartCard
                    title="Career Growth Opportunities"
                    subtitle="Sufficient opportunities to grow skills and advance career"
                    icon={<Growth size={20} />}
                >
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={surveyData.question10Data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" fill="#C4A484" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Development Opportunities */}
                <ChartCard
                    title="Preferred Development Opportunities"
                    subtitle="Most valuable development opportunities (multiple selections allowed)"
                    icon={<TrendingUp size={20} />}
                >
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <strong>Numbers represent:</strong> Number of employees who selected each development opportunity
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
                        {surveyData.question11Data.map((item, index) => (
                            <ScoreCard
                                key={item.name}
                                title={item.name}
                                value={item.value}
                                total={surveyData.totalResponses}
                                color={item.color}
                                subtitle="employees selected"
                                icon={<TrendingUp size={16} />}
                            />
                        ))}
                    </Box>
                </ChartCard>
            </Box>

            {/* Work Motivation */}
            <Box sx={{ mt: 3 }}>
                <ChartCard
                    title="Work Motivation & Engagement"
                    subtitle="Employee motivation and engagement in day-to-day work"
                    icon={<Award size={20} />}
                >
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <strong>Motivation Score:</strong> {surveyData.question12Data && surveyData.question12Data.length >= 3 ?
                                Math.round(((surveyData.question12Data[0]?.value || 0) + (surveyData.question12Data[2]?.value || 0)) / surveyData.totalResponses * 100) :
                                0}% of employees feel motivated and engaged
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                            {surveyData.question12Data && surveyData.question12Data.map((item, index) => (
                                <Chip
                                    key={item.name}
                                    label={`${item.name}: ${item.value} responses`}
                                    sx={{
                                        backgroundColor: `${COLORS[index % COLORS.length]}20`,
                                        color: COLORS[index % COLORS.length],
                                        fontWeight: 600,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={surveyData.question12Data || []}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                axisLine={true}
                                tickLine={true}
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                axisLine={true}
                                tickLine={true}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="value"
                                fill="#5A2D82"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </Box>

            {/* Leadership Qualities Analysis */}
            <Box sx={{ mt: 3 }}>
                <ChartCard
                    title="Leadership Qualities Priority Ranking"
                    subtitle="How employees rank leadership qualities by importance"
                    icon={<Star size={20} />}
                >
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Based on employee rankings from most important (1st place) to least important (4th place)
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                            gap: 2
                        }}>
                            {surveyData.leadershipQualities.map((quality, index) => (
                                <Paper key={quality.quality} sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                        {quality.quality}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem' }}>
                                        <Box>
                                            <Typography variant="caption" display="block">1st</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#5A2D82' }}>
                                                {quality.firstPlace}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" display="block">2nd</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#7B4397' }}>
                                                {quality.secondPlace}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" display="block">3rd</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#C4A484' }}>
                                                {quality.thirdPlace}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" display="block">4th</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#00B59D' }}>
                                                {quality.fourthPlace}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                </ChartCard>
            </Box>

            {/* Department Analytics */}
            <Box sx={{ mt: 3 }}>
                <ChartCard
                    title="Department Performance Overview"
                    subtitle="Satisfaction scores and response counts by department"
                    icon={<Users size={20} />}
                >
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <strong>Response Distribution:</strong> {Object.keys(surveyData.departmentBreakdown).length} departments participated
                        </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={surveyData.departmentAnalytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="departmentName"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar yAxisId="left" dataKey="responseCount" fill="#5A2D82" name="Responses" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="avgSatisfaction" fill="#00B59D" name="Avg Satisfaction" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </Box>

            {/* Improvement Suggestions */}
            <Box sx={{ mt: 3 }}>
                <ChartCard
                    title="Employee Improvement Suggestions"
                    subtitle="Most frequently mentioned areas for improvement"
                    icon={<Target size={20} />}
                >
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <strong>Top Suggestions:</strong> Based on {surveyData.improvementSuggestions.length} unique suggestions from employees
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {surveyData.improvementSuggestions.slice(0, 8).map((suggestion, index) => (
                                <Chip
                                    key={suggestion.suggestion}
                                    label={`${suggestion.suggestion} (${suggestion.frequency})`}
                                    size="small"
                                    sx={{
                                        backgroundColor: `${COLORS[index % COLORS.length]}20`,
                                        color: COLORS[index % COLORS.length],
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={surveyData.improvementSuggestions.slice(0, 6)}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="suggestion"
                                tick={{ fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={100}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="frequency" fill="#7B4397" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </Box>

            {/* Key Insights */}
            <Box sx={{ mt: 4 }}>
                <Card sx={{ borderRadius: 3, backgroundColor: '#f8f9fa' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#5A2D82', mb: 2 }}>
                            Key Insights & Recommendations
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                            gap: 2
                        }}>
                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#00B59D' }}>
                                    Strengths:
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    • High role clarity with {engagementScore}% positive responses<br />
                                    • Strong collaboration rating with {satisfactionScore}% positive feedback<br />
                                    • Good career growth opportunities with {growthScore}% satisfaction
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#7B4397' }}>
                                    Areas for Improvement:
                                </Typography>
                                <Typography variant="body2">
                                    • Focus on external training opportunities (most requested)<br />
                                    • Enhance cross-departmental collaboration<br />
                                    • Address communication and transparency concerns
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Survey Summary */}
            <Box sx={{ mt: 4 }}>
                <Card sx={{ borderRadius: 3, backgroundColor: '#f8f9fa' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#5A2D82', mb: 2 }}>
                            Survey Summary
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 2
                        }}>
                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#5A2D82' }}>
                                    {surveyData.totalResponses}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Responses
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#00B59D' }}>
                                    {Object.keys(surveyData.departmentBreakdown).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Departments
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'white', borderRadius: 2 }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#7B4397' }}>
                                    {surveyData.improvementSuggestions.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Improvement Suggestions
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default SurveyInsights;
