import type { ReactNode } from 'react';

export type GradeBand = 'elementary' | 'middleSchool' | 'highSchool';

export type GenerationType = 'filtered' | 'choice' | 'visual' | 'starter' | 'subverter' | 'assignment' | 'choice-selection';

export interface AssignmentState {
    grade: GradeBand;
    type: GenerationType;
    prompt: string;
    requirements: string[];
    img?: string;
    scaffolding?: string;
    miniLesson?: string;
    rubric?: string;
}

export interface RubricCriterion {
    criterion: string;
    levels: string[];
}

export interface ParsedRubric {
    headers: string[];
    criteria: RubricCriterion[];
}

export interface ToastMessage {
    id: number;
    message: ReactNode;
    type: 'success' | 'error' | 'info' | 'warning';
}