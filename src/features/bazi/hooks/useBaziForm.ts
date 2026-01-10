import { useState, useCallback } from "react";
import type { BaziBirthData } from "@/lib/bazi/types";

export interface BaziFormState {
    gender: 'male' | 'female';
    calendarType: 'solar' | 'lunar';
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    location: string;
    isLeapMonth: boolean;
    name?: string; // Optional name for saving
}

const DEFAULT_FORM_STATE: BaziFormState = {
    gender: 'male',
    calendarType: 'solar',
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    location: '',
    isLeapMonth: false,
};

export function useBaziForm(initialState?: Partial<BaziFormState>) {
    const [formState, setFormState] = useState<BaziFormState>({
        ...DEFAULT_FORM_STATE,
        ...initialState,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const updateField = useCallback(<K extends keyof BaziFormState>(field: K, value: BaziFormState[K]) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    }, []);

    const validate = useCallback(() => {
        if (!formState.location) {
            setError("请选择出生地点，用于真太阳时校正");
            return false;
        }
        setError("");
        return true;
    }, [formState.location]);

    return {
        formState,
        updateField,
        setFormState,
        loading,
        setLoading,
        error,
        setError,
        validate,
    };
}
