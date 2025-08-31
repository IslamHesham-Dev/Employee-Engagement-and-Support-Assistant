import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { logout } from '../store/authSlice';

const Header: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <AppBar position="static" sx={{ backgroundColor: 'white', color: 'primary.main' }}>
            <Toolbar>
                {/* Logo and App Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <Box
                        component="img"
                        src="/logo.png"
                        alt="iScore Logo"
                        sx={{ width: 92, height: 52, mr: 2, borderRadius: 0 }}
                    />
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                        }}
                    >
                        HRHelpDesk
                    </Typography>
                </Box>

                {/* Navigation */}
                {isAuthenticated && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            Welcome, {user?.firstName}
                        </Typography>
                        <Button
                            color="secondary"
                            variant="contained"
                            onClick={handleLogout}
                            size="small"
                        >
                            Logout
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;
