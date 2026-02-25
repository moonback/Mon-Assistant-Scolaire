import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TimeTrackerProps {
    activeTab: string;
    setTimeLeft: (time: number | null) => void;
    onLimitReached: (message: string) => void;
    onBedtimeReached: (message: string) => void;
}

export default function TimeTracker({
    activeTab,
    setTimeLeft,
    onLimitReached,
    onBedtimeReached
}: TimeTrackerProps) {
    const { selectedChild, setSelectedChild } = useAuth();

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        let intervalId: NodeJS.Timeout | null = null;

        if (!selectedChild || activeTab === 'parental') {
            setTimeLeft(null);
            return;
        }

        const childId = selectedChild.id;
        const today = new Date().toISOString().split('T')[0];

        const fetchAndTimeTracking = async () => {
            const { data } = await supabase
                .from('daily_child_stats')
                .select('time_spent_minutes')
                .eq('child_id', childId)
                .eq('date', today)
                .maybeSingle();

            if (!isMounted.current) return;

            let timeSpent = data?.time_spent_minutes || 0;

            const updateTime = () => {
                if (!selectedChild) return false;

                // Bedtime Enforcement
                if (selectedChild.bedtime) {
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    const [bedHour, bedMin] = selectedChild.bedtime.split(':').map(Number);
                    const bedtimeMinutes = bedHour * 60 + bedMin;
                    const wakeUpMinutes = 7 * 60; // 07:00 AM wakeup

                    let isSleepTime = false;
                    if (bedtimeMinutes > wakeUpMinutes) {
                        isSleepTime = currentMinutes >= bedtimeMinutes || currentMinutes < wakeUpMinutes;
                    } else {
                        isSleepTime = currentMinutes >= bedtimeMinutes && currentMinutes < wakeUpMinutes;
                    }

                    if (isSleepTime) {
                        onBedtimeReached(`🌙 C'est l'heure de dormir pour ${selectedChild.name} ! Ton espace magique se ferme jusqu'à 07:00.`);
                        setSelectedChild(null);
                        return true;
                    }
                }

                // Daily Limit Enforcement
                if (selectedChild.daily_time_limit > 0) {
                    const remaining = Math.max(0, selectedChild.daily_time_limit - timeSpent);
                    setTimeLeft(remaining);

                    if (remaining <= 0) {
                        onLimitReached(`🛑 ${selectedChild.name}, c'est l'heure de faire une pause ! Tes ${selectedChild.daily_time_limit} minutes d'écran sont terminées pour aujourd'hui.`);
                        setSelectedChild(null);
                        return true;
                    }
                } else {
                    setTimeLeft(null);
                }
                return false;
            };

            const blocked = updateTime();
            if (blocked) return;

            intervalId = setInterval(async () => {
                timeSpent += 1;
                const nowBlocked = updateTime();

                if (nowBlocked) {
                    if (intervalId) clearInterval(intervalId);
                    return;
                }

                await supabase
                    .from('daily_child_stats')
                    .upsert({
                        child_id: childId,
                        date: today,
                        time_spent_minutes: timeSpent
                    }, { onConflict: 'child_id,date' });
            }, 60000);
        };

        fetchAndTimeTracking();

        return () => {
            isMounted.current = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [selectedChild, activeTab, setSelectedChild, setTimeLeft, onLimitReached, onBedtimeReached]);

    return null;
}
