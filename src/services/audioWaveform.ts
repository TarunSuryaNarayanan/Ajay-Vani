export class WaveformVisualizer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  public async start(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);
      }
    } catch (e) {
      console.warn("Direct microphone stream for waveform unavailable, using visual pulse fallback.", e);
    }

    this.draw();
  }

  private draw = () => {
    if (!this.canvas || !this.ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    this.ctx.clearRect(0, 0, width, height);

    const barCount = 18;
    const barWidth = 4;
    const spacing = (width - (barCount * barWidth)) / (barCount - 1);

    if (this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
        const value = dataArray[dataIndex] || 0;
        const percent = Math.max(0.12, value / 255);
        const barHeight = percent * height;
        const x = i * (barWidth + spacing);
        const y = (height - barHeight) / 2;

        // Use color-trust (#009378) or color-action (#FC8A15)
        this.ctx.fillStyle = '#009378';
        this.ctx.fillRect(x, y, barWidth, barHeight);
      }
    } else {
      // Fallback animated wave
      const time = Date.now() / 150;
      for (let i = 0; i < barCount; i++) {
        const sin = Math.sin(time + i * 0.4);
        const percent = 0.2 + 0.6 * Math.abs(sin);
        const barHeight = percent * height;
        const x = i * (barWidth + spacing);
        const y = (height - barHeight) / 2;

        this.ctx.fillStyle = '#009378';
        this.ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.draw);
  };

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}
