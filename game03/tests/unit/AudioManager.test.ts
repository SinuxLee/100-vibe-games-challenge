import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AudioManager } from '../../src/systems/AudioManager';
import { SaveSystem } from '../../src/systems/SaveSystem';

describe('AudioManager', () => {
  let mockSoundManager: any;
  let mockScene: any;
  let mockAudioContext: any;

  beforeEach(() => {
    mockAudioContext = {
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      resume: vi.fn(() => Promise.resolve()),
      createOscillator: vi.fn(() => ({
        type: 'square',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
      createBuffer: vi.fn((_channels: number, length: number, _rate: number) => ({
        getChannelData: vi.fn(() => new Float32Array(length)),
      })),
      createBufferSource: vi.fn(() => ({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
      })),
      destination: {},
    };

    mockSoundManager = {
      play: vi.fn(),
      mute: false,
      context: mockAudioContext,
    };

    mockScene = {
      sound: mockSoundManager,
    };

    vi.spyOn(SaveSystem, 'load').mockReturnValue({
      bestScore: 0,
      longestTime: 0,
      soundEnabled: true,
      vibrateEnabled: true,
    });

    AudioManager.init(mockScene as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('init', () => {
    it('sets muted to false when sound is enabled', () => {
      expect(AudioManager.isMuted()).toBe(false);
    });

    it('sets muted to true when sound is disabled', () => {
      vi.spyOn(SaveSystem, 'load').mockReturnValue({
        bestScore: 0,
        longestTime: 0,
        soundEnabled: false,
        vibrateEnabled: true,
      });
      AudioManager.init(mockScene as any);
      expect(AudioManager.isMuted()).toBe(true);
    });

    it('syncs mute state to sound manager', () => {
      expect(mockSoundManager.mute).toBe(false);
    });
  });

  describe('toggleMute', () => {
    it('toggles from unmuted to muted', () => {
      AudioManager.toggleMute();
      expect(AudioManager.isMuted()).toBe(true);
      expect(mockSoundManager.mute).toBe(true);
    });

    it('toggles back to unmuted', () => {
      AudioManager.toggleMute();
      AudioManager.toggleMute();
      expect(AudioManager.isMuted()).toBe(false);
    });
  });

  describe('resume', () => {
    it('resumes suspended audio context', () => {
      mockAudioContext.state = 'suspended';
      AudioManager.resume();
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('does not resume running context', () => {
      mockAudioContext.state = 'running';
      AudioManager.resume();
      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });
  });

  describe('play', () => {
    it('plays sound when not muted', () => {
      AudioManager.play('test', 0.5);
      expect(mockSoundManager.play).toHaveBeenCalledWith('test', { volume: 0.5 });
    });

    it('does not play when muted', () => {
      AudioManager.toggleMute();
      AudioManager.play('test');
      expect(mockSoundManager.play).not.toHaveBeenCalled();
    });
  });

  describe('synth SFX methods', () => {
    it('playStart creates oscillators', () => {
      AudioManager.playStart();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('playSlide creates oscillator', () => {
      AudioManager.playSlide();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('playPassThrough creates oscillator', () => {
      AudioManager.playPassThrough();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('playNearMiss creates oscillators', () => {
      AudioManager.playNearMiss();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('playPauseResume creates oscillator', () => {
      AudioManager.playPauseResume();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('playDeathExplosion creates noise + oscillator', () => {
      AudioManager.playDeathExplosion();
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('playNewBest creates multiple oscillators', () => {
      AudioManager.playNewBest();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('synth methods do nothing when muted', () => {
      AudioManager.toggleMute();
      mockAudioContext.createOscillator.mockClear();
      AudioManager.playStart();
      AudioManager.playSlide();
      AudioManager.playPassThrough();
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('vibrate', () => {
    it('calls navigator.vibrate when enabled', () => {
      const vibrateMock = vi.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
        configurable: true,
      });

      AudioManager.vibrate(50);
      expect(vibrateMock).toHaveBeenCalledWith(50);
    });

    it('does not vibrate when disabled', () => {
      vi.spyOn(SaveSystem, 'load').mockReturnValue({
        bestScore: 0,
        longestTime: 0,
        soundEnabled: true,
        vibrateEnabled: false,
      });

      const vibrateMock = vi.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
        configurable: true,
      });

      AudioManager.vibrate(50);
      expect(vibrateMock).not.toHaveBeenCalled();
    });

    it('accepts array pattern', () => {
      const vibrateMock = vi.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
        configurable: true,
      });

      AudioManager.vibrate([50, 30, 100]);
      expect(vibrateMock).toHaveBeenCalledWith([50, 30, 100]);
    });
  });
});
