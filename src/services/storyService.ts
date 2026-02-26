import { supabase } from '../lib/supabase';

export interface SavedStory {
    id?: string;
    child_id: string;
    title: string;
    genre: string;
    content: any; // JSON array of scenes
    points: number;
    created_at?: string;
}

export const storyService = {
    async saveStory(story: SavedStory) {
        try {
            const { data, error } = await supabase
                .from('stories')
                .insert([story])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error saving story:', error);
            // Fallback to local storage if table doesn't exist yet
            const localStories = JSON.parse(localStorage.getItem('local_stories') || '[]');
            const newStory = { ...story, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
            localStories.push(newStory);
            localStorage.setItem('local_stories', JSON.stringify(localStories));
            return newStory;
        }
    },

    async getStoriesByChild(childId: string) {
        try {
            const { data, error } = await supabase
                .from('stories')
                .select('*')
                .eq('child_id', childId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching stories:', error);
            const localStories = JSON.parse(localStorage.getItem('local_stories') || '[]');
            return localStories.filter((s: any) => s.child_id === childId);
        }
    }
};
