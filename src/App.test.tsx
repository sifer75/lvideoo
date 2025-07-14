import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from 'src/App';
window.electronAPI = {
  getVideoThumbnail: jest.fn(() => Promise.resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')),
  send: jest.fn(),
  receive: jest.fn(() => jest.fn()),
  getScreenSources: jest.fn(),
  saveRecording: jest.fn(),
  onSaveRecordingSuccess: jest.fn(() => jest.fn()),
  onSaveRecordingError: jest.fn(() => jest.fn()),
  openVideoFileDialog: jest.fn(() => Promise.resolve({ canceled: false, filePath: 'mock/path/to/imported_video.mp4' })),
  getVideosInFolder: jest.fn(() => Promise.resolve([])), 
  getStoredSaveFolderPath: jest.fn(() => Promise.resolve('/mock/save/path')),
  copyToClipboard: jest.fn(),
  deleteVideo: jest.fn(() => Promise.resolve({ success: true })),
};
describe('App - Pagination Logic', () => {
  
  const createMockVideos = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `video-${i + 1}`,
      title: `video${i + 1}.mp4`, 
      path: `path/to/video${i + 1}.mp4`,
      shareLink: '',
    }));
  };
  beforeEach(() => {
    
    jest.clearAllMocks();
    
    (window.electronAPI.getVideosInFolder as jest.Mock).mockResolvedValue(
      createMockVideos(25).map(v => v.path) 
    );
  });
  it('calculates total pages correctly', async () => {
    render(<App />);
    
    await screen.findByText('Page 1 sur 3'); 
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
    
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await screen.findByText('Page 2 sur 3');
    
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
    
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i })); 
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i })); 
    await screen.findByText('Page 3 sur 3');
    expect(screen.getByRole('button', { name: /Suivant/i })).toBeDisabled();
  });
  it('displays correct videos for the current page', async () => {
    render(<App />);
    await screen.findByText('Page 1 sur 3'); 
    
    expect(screen.getByText('video1.mp4')).toBeInTheDocument();
    expect(screen.getByText('video10.mp4')).toBeInTheDocument();
    expect(screen.queryByText('video11.mp4')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await screen.findByText('Page 2 sur 3');
    
    expect(screen.queryByText('video10.mp4')).not.toBeInTheDocument();
    expect(screen.getByText('video11.mp4')).toBeInTheDocument();
    expect(screen.getByText('video20.mp4')).toBeInTheDocument();
    expect(screen.queryByText('video21.mp4')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }));
    await screen.findByText('Page 3 sur 3');
    
    expect(screen.queryByText('video20.mp4')).not.toBeInTheDocument();
    expect(screen.getByText('video21.mp4')).toBeInTheDocument();
    expect(screen.getByText('video25.mp4')).toBeInTheDocument();
  });
});