import React from 'react';
import { Box, Typography, Tabs, Tab, Card, CardContent } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import EmployeeManagement from '../components/HR/EmployeeManagement';
import SurveyManagement from '../components/HR/SurveyManagement';
import SurveyList from '../components/Employee/SurveyList';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`dashboard-tabpanel-${index}`}
            aria-labelledby={`dashboard-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const Dashboard: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [value, setValue] = React.useState(0);

    console.log('Dashboard: User data:', user);
    console.log('Dashboard: User role:', user?.role);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    if (user?.role === 'HR') {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Welcome, {user?.firstName}!
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    HR Management Dashboard
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
                    <Tabs value={value} onChange={handleChange} aria-label="HR dashboard tabs">
                        <Tab label="Employee Management" />
                        <Tab label="Survey Management" />
                        <Tab label="Analytics" />
                        <Tab label="Chatbot" />
                    </Tabs>
                </Box>

                <TabPanel value={value} index={0}>
                    <EmployeeManagement />
                </TabPanel>
                <TabPanel value={value} index={1}>
                    <SurveyManagement />
                </TabPanel>
                <TabPanel value={value} index={2}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Analytics Dashboard
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Survey analytics and insights will be displayed here.
                            </Typography>
                        </CardContent>
                    </Card>
                </TabPanel>
                <TabPanel value={value} index={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                AI Chatbot Management
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Chatbot configuration and training will be available here.
                            </Typography>
                        </CardContent>
                    </Card>
                </TabPanel>
            </Box>
        );
    }

    // Employee Dashboard
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Welcome, {user?.firstName}!
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                Employee Dashboard
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
                <Tabs value={value} onChange={handleChange} aria-label="Employee dashboard tabs">
                    <Tab label="Surveys" />
                    <Tab label="HR Chatbot" />
                    <Tab label="Policies" />
                    <Tab label="Support" />
                </Tabs>
            </Box>

            <TabPanel value={value} index={0}>
                <SurveyList />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            HR Chatbot
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            AI-powered chatbot for HR questions will be available here.
                        </Typography>
                    </CardContent>
                </Card>
            </TabPanel>
            <TabPanel value={value} index={2}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Company Policies
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Access to company policies and procedures will be available here.
                        </Typography>
                    </CardContent>
                </Card>
            </TabPanel>
            <TabPanel value={value} index={3}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            HR Support
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Submit and track HR support requests here.
                        </Typography>
                    </CardContent>
                </Card>
            </TabPanel>
        </Box>
    );
};

export default Dashboard;
