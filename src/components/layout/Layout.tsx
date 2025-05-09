// src/components/layout/Layout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="py-10">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
