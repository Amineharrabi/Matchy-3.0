import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share, Platform } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSpotify } from '../../hooks/useSpotify';
import { dataStorage } from '../../services/dataStorage';
import {
    LogOut,
    Moon,
    Bell,
    Shield,
    Trash2,
    Volume2,
    Share2,
    Sun,
    HelpCircle
} from 'lucide-react-native';
import { router } from 'expo-router';

interface Setting {
    id: string;
    title: string;
    description: string;
    type: 'toggle' | 'button';
    icon: React.ReactNode;
    value?: boolean;
    onPress?: () => void;
    dangerous?: boolean;
}

export default function SettingsScreen() {
    const { logout, user } = useSpotify();
    const [isLoading, setIsLoading] = useState(false);
    const { isDarkMode, toggleDarkMode, colors } = useTheme();

    const [settings, setSettings] = useState<{ [key: string]: boolean }>({
        darkMode: isDarkMode,
        notifications: true,
        privateMode: false,
        autoplayEnabled: true
    });

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        setSettings(prev => ({
            ...prev,
            darkMode: isDarkMode
        }));
    }, [isDarkMode]);

    const loadSettings = async () => {
        try {
            const savedSettings = await dataStorage.getPreferences();
            if (savedSettings) {
                setSettings(prevSettings => ({
                    ...prevSettings,
                    ...savedSettings
                }));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleSettingChange = async (settingId: string, value: boolean) => {
        try {
            if (settingId === 'darkMode') {
                await toggleDarkMode();
                return;
            }
            const newSettings = {
                ...settings,
                [settingId]: value
            };
            setSettings(newSettings);
            await dataStorage.savePreferences(newSettings);
        } catch (error) {
            console.error('Failed to save setting:', error);
            Alert.alert('Error', 'Failed to save setting. Please try again.');
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await dataStorage.clearAllData();
                            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure data is cleared
                            await logout();
                            setIsLoading(false);
                            // Let the navigation guard handle the redirect
                        } catch (error) {
                            console.error('Logout failed:', error);
                            setIsLoading(false);
                            Alert.alert('Error', 'Failed to log out. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear All Data',
            'This will permanently delete all your locally stored data including playlist history and preferences. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dataStorage.clearAllData();
                            await loadSettings();
                            Alert.alert('Success', 'All data has been cleared.');
                        } catch (error) {
                            console.error('Failed to clear data:', error);
                            Alert.alert('Error', 'Failed to clear data. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: 'Check out Matchy - Discover your next favorite song with AI-powered recommendations! \n\nDownload it at: https://Matchy.tn',
                title: 'Matchy - AI Music Discovery',
                url: 'https://Matchy.tn'
            });

            if (result.action === Share.sharedAction) {
                console.log('App shared successfully!');
            }
        } catch (error) {
            Alert.alert('Error', 'Could not share at this time. Please try again.');
            console.error('Share error:', error);
        }
    };
    const settingsList: Setting[] = [
        {
            id: 'darkMode',
            title: 'Dark Mode',
            description: 'Use dark theme throughout the app',
            type: 'toggle',
            icon: isDarkMode ?
                <Moon color="#9B59B6" size={24} strokeWidth={2} /> :
                <Sun color="#9B59B6" size={24} strokeWidth={2} />,
            value: settings.darkMode
        },
        {
            id: 'notifications',
            title: 'Notifications',
            description: 'Receive updates and recommendations',
            type: 'toggle',
            icon: <Bell color="#3498DB" size={24} strokeWidth={2} />,
            value: settings.notifications
        },
        {
            id: 'privateMode',
            title: 'Private Mode',
            description: 'Keep your listening history private',
            type: 'toggle',
            icon: <Shield color="#2ECC71" size={24} strokeWidth={2} />,
            value: settings.privateMode
        },
        {
            id: 'autoplayEnabled',
            title: 'Autoplay',
            description: 'Automatically play music recommendations',
            type: 'toggle',
            icon: <Volume2 color="#F1C40F" size={24} strokeWidth={2} />,
            value: settings.autoplayEnabled
        },
        {
            id: 'share',
            title: 'Share App',
            description: 'Share SoundScope with friends',
            type: 'button',
            icon: <Share2 color="#1ABC9C" size={24} strokeWidth={2} />,
            onPress: handleShare
        },
        {
            id: 'help',
            title: 'Help & Support',
            description: 'Get help and contact support',
            type: 'button',
            icon: <HelpCircle color="#3498DB" size={24} strokeWidth={2} />,
            onPress: () => Alert.alert('Coming Soon', 'Support center will be available in the next update!')
        },
        {
            id: 'clearData',
            title: 'Clear Data',
            description: 'Delete all locally stored data',
            type: 'button',
            icon: <Trash2 color="#FF6B35" size={24} strokeWidth={2} />,
            onPress: handleClearData,
            dangerous: true
        },
        {
            id: 'logout',
            title: 'Logout',
            description: `Signed in as ${user?.display_name}`,
            type: 'button',
            icon: <LogOut color="#FF6B35" size={24} strokeWidth={2} />,
            onPress: handleLogout,
            dangerous: true
        }
    ];

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <LinearGradient colors={[colors.background, colors.surface]} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
                </View>

                <ScrollView style={styles.scrollView}>
                    {settingsList.map((setting) => (
                        <View
                            key={setting.id}
                            style={[
                                styles.settingCard,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                                setting.dangerous && styles.dangerousCard
                            ]}
                        >
                            <View style={styles.settingHeader}>
                                <View style={[styles.iconContainer, {
                                    backgroundColor: setting.dangerous
                                        ? 'rgba(255, 107, 53, 0.1)'
                                        : `${colors.primary}20`
                                }]}
                                >
                                    {setting.icon}
                                </View>
                                <View style={styles.settingContent}>
                                    <Text style={[styles.settingTitle, { color: colors.text }]}>{setting.title}</Text>
                                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                                        {setting.description}
                                    </Text>
                                </View>
                                {setting.type === 'toggle' ? (
                                    <Switch
                                        value={setting.value}
                                        onValueChange={(value) => handleSettingChange(setting.id, value)}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                        thumbColor={setting.value ? '#FFFFFF' : '#f4f3f4'}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={[
                                            styles.button,
                                            setting.dangerous && styles.dangerousButton
                                        ]}
                                        onPress={setting.onPress}
                                    >
                                        <Text style={[
                                            styles.buttonText,
                                            setting.dangerous && styles.dangerousButtonText
                                        ]}>
                                            {setting.title}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    settingCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    dangerousCard: {
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 107, 53, 0.05)',
    },
    settingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
        marginBottom: 4,
    },
    settingDescription: {
        color: '#B3B3B3',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#1DB954',
    },
    dangerousButton: {
        backgroundColor: '#FF6B35',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Inter-Bold',
    },
    dangerousButtonText: {
        color: '#FFFFFF',
    }
});
