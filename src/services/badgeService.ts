import { supabase } from '../lib/supabase';
import { BADGE_DEFINITIONS } from '../config/badges';

export const checkAndAwardBadges = async (childId: string, currentStars: number, currentBadges: string[] = []) => {
    const newBadges: string[] = [];

    // Progression Triggers
    if (currentStars >= 10 && !currentBadges.includes('first_steps')) {
        newBadges.push('first_steps');
    }
    if (currentStars >= 100 && !currentBadges.includes('star_collector')) {
        newBadges.push('star_collector');
    }
    if (currentStars >= 500 && !currentBadges.includes('star_expert')) {
        newBadges.push('star_expert');
    }
    if (currentStars >= 1000 && !currentBadges.includes('milky_way')) {
        newBadges.push('milky_way');
    }

    // Excellence Triggers (would normally check quiz history, but for now we can trigger some based on stars too or pass extra params)

    if (newBadges.length > 0) {
        const updatedBadges = [...currentBadges, ...newBadges];
        const { error } = await supabase
            .from('children')
            .update({ badges: updatedBadges })
            .eq('id', childId);

        if (error) {
            console.error('Error awarding badges:', error);
            return [];
        }
        return newBadges;
    }

    return [];
};
