import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VideoLibrary, { VideoItem, VideoLibraryProps } from './VideoLibrary';

// Mock de window.electronAPI car il n'est pas disponible dans l'environnement de test JSDOM
// Nous devons mocker toutes les fonctions utilisées par VideoLibrary et VideoItemComponent
let resolveThumbnailPromise: ((value: string | PromiseLike<string>) => void)[] = [];

window.electronAPI = {
  getVideoThumbnail: jest.fn(() => Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')), // Une image base64 transparente
  send: jest.fn(),
  receive: jest.fn(() => jest.fn()), // receive returns a cleanup function
  getScreenSources: jest.fn(() => Promise.resolve([])),
  saveRecording: jest.fn(),
  onSaveRecordingSuccess: jest.fn(() => jest.fn()),
  onSaveRecordingError: jest.fn(() => jest.fn()),
  openVideoFileDialog: jest.fn(() => Promise.resolve({ filePath: 'mock/path/to/imported_video.mp4', canceled: false })),
  getVideosInFolder: jest.fn(() => Promise.resolve([])),
  getStoredSaveFolderPath: jest.fn(() => Promise.resolve('/mock/save/path')),
  copyToClipboard: jest.fn(),
  deleteVideo: jest.fn(() => Promise.resolve({ success: true })),
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

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the library title', () => {
    render(<VideoLibrary {...defaultProps} />);
    expect(screen.getByText('Ma Librairie')).toBeInTheDocument();
  });

  it('displays "Aucune vidéo enregistrée." when there are no videos', () => {
    render(<VideoLibrary {...defaultProps} />);
    expect(screen.getByText('Aucune vidéo enregistrée.')).toBeInTheDocument();
  });

  

  it('calls onOpenRecorder when "Ouvrir Enregistreur" button is clicked', () => {
    render(<VideoLibrary {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir Enregistreur/i }));
    jest.runAllTimers();
    expect(defaultProps.onOpenRecorder).toHaveBeenCalledTimes(1);
  });

  it('calls onImportVideo when "Importer une vidéo" button is clicked', () => {
    render(<VideoLibrary {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Importer une vidéo/i }));
    jest.runAllTimers();
    expect(defaultProps.onImportVideo).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleSelectMode when "Activer Multi-sélection" button is clicked', () => {
    render(<VideoLibrary {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Activer Multi-sélection/i }));
    jest.runAllTimers();
    expect(defaultProps.onToggleSelectMode).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectVideo when a video item is clicked (not in multi-select mode)', async () => {
    const video = { id: '1', title: 'Test Video', path: 'path/to/video.mp4', shareLink: '' };
    render(<VideoLibrary {...defaultProps} videos={[video]} isMultiSelectMode={false} />);
    jest.runAllTimers(); // Ensure thumbnail is loaded
    fireEvent.click(screen.getByText('Test Video'));
    expect(defaultProps.onSelectVideo).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelectVideo).toHaveBeenCalledWith(video);
  });

  it('calls onShareVideo when the share button of a video item is clicked', async () => {
    const video = { id: '1', title: 'Test Video', path: 'path/to/video.mp4', shareLink: '' };
    render(<VideoLibrary {...defaultProps} videos={[video]} />);
    jest.runAllTimers(); // Ensure thumbnail is loaded
    fireEvent.click(screen.getByRole('button', { name: /Partager/i }));
    expect(defaultProps.onShareVideo).toHaveBeenCalledTimes(1);
    expect(defaultProps.onShareVideo).toHaveBeenCalledWith(video);
  });

  it('calls onDeleteVideo when the delete button of a video item is clicked', async () => {
    const video = { id: '1', title: 'Test Video', path: 'path/to/video.mp4', shareLink: '' };
    render(<VideoLibrary {...defaultProps} videos={[video]} />);
    jest.runAllTimers(); // Ensure thumbnail is loaded
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/i }));
    expect(defaultProps.onDeleteVideo).toHaveBeenCalledTimes(1);
    expect(defaultProps.onDeleteVideo).toHaveBeenCalledWith(video);
  });

  it('calls onDeleteSelected when "Supprimer la sélection" button is clicked in multi-select mode', () => {
    const videos = [
      { id: '1', title: 'Test Video 1', path: 'path/to/video1.mp4', shareLink: '' },
    ];
    render(<VideoLibrary {...defaultProps} videos={videos} isMultiSelectMode={true} selectedVideos={videos} />);
    fireEvent.click(screen.getByRole('button', { name: /Supprimer la sélection/i }));
    expect(defaultProps.onDeleteSelected).toHaveBeenCalledTimes(1);
  });

  it('calls onShareSelected when "Partager la sélection" button is clicked in multi-select mode', () => {
    const videos = [
      { id: '1', title: 'Test Video 1', path: 'path/to/video1.mp4', shareLink: '' },
    ];
    render(<VideoLibrary {...defaultProps} videos={videos} isMultiSelectMode={true} selectedVideos={videos} />);
    fireEvent.click(screen.getByRole('button', { name: /Partager la sélection/i }));
    expect(defaultProps.onShareSelected).toHaveBeenCalledTimes(1);
  });
});