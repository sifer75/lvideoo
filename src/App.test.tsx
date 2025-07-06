import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from 'src/App';

// Mock window.electronAPI as it's used in App.tsx
window.electronAPI = {
  getVideoThumbnail: jest.fn(() => Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')),
  send: jest.fn(),
  receive: jest.fn(() => jest.fn()),
  getScreenSources: jest.fn(),
  saveRecording: jest.fn(),
  onSaveRecordingSuccess: jest.fn(() => jest.fn()),
  onSaveRecordingError: jest.fn(() => jest.fn()),
  openVideoFileDialog: jest.fn(() => Promise.resolve({ canceled: false, filePath: 'mock/path/to/imported_video.mp4' })),
  getVideosInFolder: jest.fn(() => Promise.resolve([])), // Start with no videos
  getStoredSaveFolderPath: jest.fn(() => Promise.resolve('/mock/save/path')),
  copyToClipboard: jest.fn(),
  deleteVideo: jest.fn(() => Promise.resolve({ success: true })),
};

describe('App - Pagination Logic', () => {
  // Helper to create a list of mock videos
  const createMockVideos = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `video-${i + 1}`,
      title: `video${i + 1}.mp4`, // Changed title to match expected format
      path: `path/to/video${i + 1}.mp4`,
      shareLink: '',
    }));
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Ensure getVideosInFolder returns a predictable set of videos for pagination tests
    (window.electronAPI.getVideosInFolder as jest.Mock).mockResolvedValue(
      createMockVideos(25).map(v => v.path) // 25 videos, 10 per page means 3 pages
    );
  });

  it('calculates total pages correctly', async () => {
    render(<App />);
    // Wait for the initial video list to load
    await screen.findByText('Page 1 sur 3'); // 25 videos, 10 per page = 3 pages
    expect(screen.getByText('Page 1 sur 3')).toBeInTheDocument();
  });

  it('navigates to the next page', async () => {
    render(<App />);
    await screen.findByText('Page 1 sur 3');

    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await screen.findByText('Page 2 sur 3');
    expect(screen.getByText('Page 2 sur 3')).toBeInTheDocument();
  });

  it('navigates to the previous page', async () => {
    render(<App />);
    await screen.findByText('Page 1 sur 3');

    // Go to page 2 first
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await screen.findByText('Page 2 sur 3');

    // Go back to page 1
    fireEvent.click(screen.getByRole('button', { name: /Précédent/i }));
    await screen.findByText('Page 1 sur 3');
    expect(screen.getByText('Page 1 sur 3')).toBeInTheDocument();
  });

  it('disables "Précédent" button on the first page', async () => {
    render(<App />);
    await screen.findByText('Page 1 sur 3');
    expect(screen.getByRole('button', { name: /Précédent/i })).toBeDisabled();
  });

  it('disables "Suivant" button on the last page', async () => {
    render(<App />);
    await screen.findByText('Page 1 sur 3');

    // Go to the last page (page 3)
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i })); // Page 2
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i })); // Page 3
    await screen.findByText('Page 3 sur 3');

    expect(screen.getByRole('button', { name: /Suivant/i })).toBeDisabled();
  });

  it('displays correct videos for the current page', async () => {
    render(<App />);
    await screen.findByText('Page 1 sur 3'); // Ensure initial load

    // On page 1, videos 1-10 should be visible
    expect(screen.getByText('video1.mp4')).toBeInTheDocument();
    expect(screen.getByText('video10.mp4')).toBeInTheDocument();
    expect(screen.queryByText('video11.mp4')).not.toBeInTheDocument();

    // Go to page 2
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await screen.findByText('Page 2 sur 3');

    // On page 2, videos 11-20 should be visible
    expect(screen.queryByText('video10.mp4')).not.toBeInTheDocument();
    expect(screen.getByText('video11.mp4')).toBeInTheDocument();
    expect(screen.getByText('video20.mp4')).toBeInTheDocument();
    expect(screen.queryByText('video21.mp4')).not.toBeInTheDocument();

    // Go to page 3
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await screen.findByText('Page 3 sur 3');

    // On page 3, videos 21-25 should be visible
    expect(screen.queryByText('video20.mp4')).not.toBeInTheDocument();
    expect(screen.getByText('video21.mp4')).toBeInTheDocument();
    expect(screen.getByText('video25.mp4')).toBeInTheDocument();
  });
});