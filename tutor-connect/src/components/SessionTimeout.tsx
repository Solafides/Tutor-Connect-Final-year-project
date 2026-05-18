"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const WARNING_TIME = 9 * 60 * 1000; // Show warning at 9 minutes

export function SessionTimeout() {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<boolean>(false);

    const resetTimer = useCallback(() => {
        // Clear existing timers
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        warningRef.current = false;

        // Set warning timer (at 9 minutes)
        timeoutRef.current = setTimeout(() => {
            warningRef.current = true;
            console.warn("Session will expire in 1 minute due to inactivity");
        }, WARNING_TIME);

        // Set logout timer (at 10 minutes)
        timeoutRef.current = setTimeout(async () => {
            console.log("Session expired due to inactivity. Logging out...");
            await signOut({ redirect: true, callbackUrl: "/login" });
        }, INACTIVITY_TIMEOUT);
    }, []);

    useEffect(() => {
        // Start timer on mount
        resetTimer();

        // Track user activity
        const activityEvents = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click",
            "focus",
        ];

        const handleActivity = () => {
            if (!warningRef.current) {
                resetTimer();
            }
        };

        // Add event listeners with debounce
        activityEvents.forEach((event) => {
            document.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            activityEvents.forEach((event) => {
                document.removeEventListener(event, handleActivity);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [resetTimer]);

    return null;
}
