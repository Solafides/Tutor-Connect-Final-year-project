import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ClassroomClient from './ClassroomClient';

export default function TutorClassroomPage() {
    return (
        <DashboardLayout>
            <ClassroomClient />
        </DashboardLayout>
    );
}