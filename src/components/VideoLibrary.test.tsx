import React from 'react';
import { render, screen } from '@testing-library/react';
import VideoLibrary, { VideoItem, VideoLibraryProps } from './VideoLibrary';

// Mock de window.electronAPI car il n'est pas disponible dans l'environnement de test JSDOM
// Nous devons mocker toutes les fonctions utilisées par VideoLibrary et VideoItemComponent
window.electronAPI = {
  getVideoThumbnail: jest.fn(() => Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')), // Une image base64 transparente
  // Ajoutez d'autres mocks si nécessaire pour les autres fonctions utilisées
  send: jest.fn(),
  receive: jest.fn(),
  getScreenSources: jest.fn(),
  saveRecording: jest.fn(),
  onSaveRecordingSuccess: jest.fn(),
  onSaveRecordingError: jest.fn(),
  openVideoFileDialog: jest.fn(),
  getVideosInFolder: jest.fn(),
  getStoredSaveFolderPath: jest.fn(),
  copyToClipboard: jest.fn(),
  deleteVideo: jest.fn(),
};

describe('VideoLibrary', () => {
  const defaultProps: VideoLibraryProps = {
    videos: [],
    onOpenRecorder: jest.fn(),
    onSelectVideo: jest.fn(),
    onShareVideo: jest.fn(),
    onDeleteVideo: jest.fn(),
    onImportVideo: jest.fn(),
    selectedVideos: [],
    onToggleSelect: jest.fn(),
    isMultiSelectMode: false,
    onToggleSelectMode: jest.fn(),
    onDeleteSelected: jest.fn(),
    onShareSelected: jest.fn(),
    searchQuery: '',
    onSearchChange: jest.fn(),
    currentPage: 1,
    totalPages: 1,
    goToNextPage: jest.fn(),
    goToPreviousPage: jest.fn(),
  };

  it('renders the library title', () => {
    render(<VideoLibrary {...defaultProps} />);
    expect(screen.getByText('Ma Librairie')).toBeInTheDocument();
  });

  it('displays "Aucune vidéo enregistrée." when there are no videos', () => {
    render(<VideoLibrary {...defaultProps} />);
    expect(screen.getByText('Aucune vidéo enregistrée.')).toBeInTheDocument();
  });

  it('displays videos when provided', () => {
    const videos = [
      { id: '1', title: 'Test Video 1', path: 'path/to/video1.mp4', shareLink: '' },
      { id: '2', title: 'Test Video 2', path: 'path/to/video2.mp4', shareLink: '' },
    ];
    render(<VideoLibrary {...defaultProps} videos={videos} />);
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
    expect(screen.queryByText('Aucune vidéo enregistrée.')).not.toBeInTheDocument();
  });
});