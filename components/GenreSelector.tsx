import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MUSIC_GENRES, GENRE_COLORS } from '../constants/genres';

interface GenreSelectorProps {
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
  maxSelection?: number;
}

export function GenreSelector({ selectedGenres, onGenreToggle, maxSelection = 5 }: GenreSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Genres ({selectedGenres.length}/{maxSelection})</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MUSIC_GENRES.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          const canSelect = selectedGenres.length < maxSelection || isSelected;
          
          return (
            <TouchableOpacity
              key={genre}
              onPress={() => canSelect && onGenreToggle(genre)}
              style={[
                styles.genreChip,
                isSelected && styles.selectedChip,
                !canSelect && styles.disabledChip,
                { borderColor: GENRE_COLORS[genre] || '#1DB954' }
              ]}
              disabled={!canSelect}
            >
              <Text style={[
                styles.genreText,
                isSelected && styles.selectedText,
                !canSelect && styles.disabledText
              ]}>
                {genre.replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: 'transparent',
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedChip: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  disabledChip: {
    opacity: 0.5,
  },
  genreText: {
    color: '#B3B3B3',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#666',
  },
});