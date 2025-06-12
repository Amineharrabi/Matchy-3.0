import { useTheme } from '../contexts/ThemeContext';
import { StyleSheet } from 'react-native';

export function useAppTheme() {
    const { isDarkMode, colors } = useTheme();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
        },
        safeArea: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 10,
        },
        title: {
            color: colors.text,
            fontSize: 32,
            fontWeight: 'bold',
            fontFamily: 'Inter-Bold',
        },
        scrollView: {
            flex: 1,
            padding: 20,
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
        }
    });

    return {
        gradientColors: [colors.background, colors.surface],
        styles,
        colors
    };
}
