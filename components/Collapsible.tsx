// components/CollapsibleTabBar.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, List, History, BarChart3, Settings, Shield } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

export function CollapsibleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const [collapsed, setCollapsed] = useState(true);

    const toggleCollapse = () => setCollapsed(!collapsed);

    return (
        <View style={{
            flexDirection: 'column',
            backgroundColor: '#111',
            borderTopWidth: 1,
            borderTopColor: '#333',
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
                {state.routes.slice(0, 5).map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel ?? options.title ?? route.name;
                    const isFocused = state.index === index;

                    const onPress = () => navigation.navigate(route.name);

                    const Icon = getTabIcon(route.name);

                    return (
                        <TouchableOpacity key={route.key} onPress={onPress} style={{ alignItems: 'center' }}>
                            <Icon size={24} color={isFocused ? '#1DB954' : '#888'} />
                            <Text style={{ color: isFocused ? '#1DB954' : '#888', fontSize: 12 }}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}

                <TouchableOpacity onPress={toggleCollapse} style={{ alignItems: 'center' }}>
                    <Text style={{ color: '#1DB954' }}>{collapsed ? '⋁' : '⋀'}</Text>
                </TouchableOpacity>
            </View>

            {!collapsed && (
                <Animatable.View animation="fadeInUp" duration={300} style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
                    {state.routes.slice(5).map((route, index) => {
                        const { options } = descriptors[route.key];
                        const label = options.tabBarLabel ?? options.title ?? route.name;
                        const isFocused = state.index === index + 5;

                        const onPress = () => navigation.navigate(route.name);

                        const Icon = getTabIcon(route.name);

                        return (
                            <TouchableOpacity key={route.key} onPress={onPress} style={{ alignItems: 'center' }}>
                                <Icon size={24} color={isFocused ? '#1DB954' : '#888'} />
                                <Text style={{ color: isFocused ? '#1DB954' : '#888', fontSize: 12 }}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </Animatable.View>
            )}
        </View>
    );
}

function getTabIcon(name: string) {
    switch (name) {
        case 'index':
            return Home;
        case 'playlists':
            return List;
        case 'history':
            return History;
        case 'analytics':
            return BarChart3;
        case 'settings':
            return Settings;
        case 'developer':
            return Shield;
        default:
            return Settings;
    }
}
