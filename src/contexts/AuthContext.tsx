import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    organization_id: string | null;
    role: 'owner' | 'admin' | 'member';
}

interface Organization {
    id: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    organization: Organization | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    createOrganization: (name: string) => Promise<{ error: any }>;
    updateOrganization: (name: string) => Promise<{ error: any }>;
    updateEmail: (email: string) => Promise<{ error: any }>;
    updatePassword: (password: string) => Promise<{ error: any }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // If it's a token refresh, we don't need to reload the profile
                if (event === 'TOKEN_REFRESHED') {
                    return;
                }

                // If signing in, ensure we show loading state to prevent premature redirects
                if (event === 'SIGNED_IN') {
                    setLoading(true);
                }

                loadUserProfile(session.user.id);
            } else {
                setProfile(null);
                setOrganization(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserProfile = async (userId: string) => {
        try {
            console.log('Loading profile for user:', userId);
            // Get profile
            let { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
            }

            // If profile doesn't exist, create it (for users created before trigger was added)
            if (profileError && profileError.code === 'PGRST116') {
                console.log('Profile not found, attempting to create...');
                const { data: userData } = await supabase.auth.getUser();
                if (userData.user) {
                    const { data: newProfile, error: insertError } = await supabase
                        .from('profiles')
                        .insert({
                            id: userId,
                            email: userData.user.email!,
                            role: 'owner',
                        })
                        .select()
                        .single();

                    if (insertError) {
                        console.error('Error creating profile:', insertError);
                        throw insertError;
                    }
                    profileData = newProfile;
                    console.log('Profile created successfully');
                }
            } else if (profileError) {
                throw profileError;
            }

            setProfile(profileData);
            console.log('Profile loaded:', profileData);

            // Get organization if user has one
            if (profileData?.organization_id) {
                console.log('Fetching organization:', profileData.organization_id);
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', profileData.organization_id)
                    .single();

                if (orgError) {
                    console.error('Error fetching organization:', orgError);
                    throw orgError;
                }
                setOrganization(orgData);
                console.log('Organization loaded:', orgData);
            } else {
                console.log('No organization_id in profile');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        // Profile is created automatically by database trigger
        // No need to manually insert

        return { error };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        // State clearing is handled by onAuthStateChange to avoid race conditions
    };

    const createOrganization = async (name: string) => {
        if (!user) return { error: new Error('No user logged in') };

        try {
            // Create organization
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert({ name })
                .select()
                .single();

            if (orgError) throw orgError;

            // Update profile with organization_id
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ organization_id: orgData.id })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Reload profile
            await loadUserProfile(user.id);

            return { error: null };
        } catch (error) {
            return { error };
        }
    };

    const updateOrganization = async (name: string) => {
        if (!organization?.id) return { error: new Error('No organization selected') };

        try {
            const { error } = await supabase
                .from('organizations')
                .update({ name })
                .eq('id', organization.id);

            if (error) throw error;

            setOrganization(prev => prev ? { ...prev, name } : null);
            return { error: null };
        } catch (error) {
            return { error };
        }
    };

    const updateEmail = async (email: string) => {
        const { error } = await supabase.auth.updateUser({ email });
        return { error };
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error };
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                organization,
                session,
                loading,
                signUp,
                signIn,
                signOut,
                createOrganization,
                updateOrganization,
                updateEmail,
                updatePassword,
                refreshProfile: () => user ? loadUserProfile(user.id) : Promise.resolve(),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
