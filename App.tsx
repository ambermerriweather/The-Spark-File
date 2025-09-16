import React, { useState } from 'react';
import { TeacherView } from './components/TeacherView';
import { StudentWorkspace } from './components/StudentWorkspace';
import type { AssignmentState } from './types';
import { ToastProvider } from './hooks/useToast';
import { ToastContainer } from './components/Toast';

const App: React.FC = () => {
    const [assignment, setAssignment] = useState<AssignmentState | null>(null);

    const handleOpenWorkspace = (state: AssignmentState) => {
        setAssignment(state);
    };

    const handleCloseWorkspace = () => {
        setAssignment(null);
    };

    return (
        <ToastProvider>
            {assignment ? (
                <StudentWorkspace assignment={assignment} onClose={handleCloseWorkspace} />
            ) : (
                <div id="main-app" className="w-full max-w-5xl rounded-2xl p-6 md:p-10 space-y-8 bg-white border border-slate-200 shadow-xl">
                    <TeacherView onOpenWorkspace={handleOpenWorkspace} />
                </div>
            )}
            <ToastContainer />
        </ToastProvider>
    );
};

export default App;
