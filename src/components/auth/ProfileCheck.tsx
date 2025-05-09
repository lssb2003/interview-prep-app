// src/components/auth/ProfileCheck.tsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../services/firebase/firestore';
import { toast } from 'react-hot-toast';

interface ProfileCheckProps {
    children: React.ReactNode;
}

const ProfileCheck: React.FC<ProfileCheckProps> = ({ children }) => {
    const { currentUser } = useAuth();
    const [hasProfile, setHasProfile] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkProfile = async () => {
            if (!currentUser) return;

            try {
                const profile = await getUserProfile(currentUser.uid);
                setHasProfile(!!profile);
            } catch (error) {
                console.error('Error checking profile:', error);
                setHasProfile(false);
            } finally {
                setLoading(false);
            }
        };

        checkProfile();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Redirect to profile setup if user doesn't have a profile
    if (hasProfile === false) {
        // Use toast() instead of toast.info
        toast('Please complete your profile before accessing this feature');
        return <Navigate to="/profile/setup" />;
    }

    return <>{children}</>;
};

export default ProfileCheck;