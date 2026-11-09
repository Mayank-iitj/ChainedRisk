import React, { useEffect, useRef, useState } from 'react';
import CrystalizedBall from '../components/CrystalizedBall';
import DitherVeil from '../components/DitherVeil';
import ElasticMesh from '../components/ElasticMesh';
import HalftoneReveal from '../components/HalftoneReveal';

interface LandingPageProps {
  onLaunchApp: () => void;
  onExploreScenario?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp, onExploreScenario }) => {
  const [introState, setIntroState] = useState<'showing' | 'lifting' | 'hidden'>('showing');
  const [headlineActive, setHeadlineActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [liveReadout, setLiveReadout] = useState('FREQ 432.8 HZ // GAIN +41.0 PTS');
  const [ballPreset, setBallPreset] = useState<'plasma' | 'nebula' | 'aurora' | 'abyss' | 'solar' | 'ember'>('plasma');
  const [elasticMaterial, setElasticMaterial] = useState<'balloon' | 'chrome' | 'jelly' | 'clay'>('balloon');
  const [halftoneShape, setHalftoneShape] = useState<'dot' | 'line' | 'diamond' | 'cross'>('dot');
  const [halftoneMode, setHalftoneMode] = useState<'mono' | 'duotone' | 'color'>('duotone');

  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tile1Ref = useRef<HTMLCanvasElement | null>(null);
  const tile2Ref = useRef<HTMLCanvasElement | null>(null);
  const tile3Ref = useRef<HTMLCanvasElement | null>(null);
  const tile4Ref = useRef<HTMLCanvasElement | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    if (mq.matches) {
      setIntroState('hidden');
      setHeadlineActive(true);
    }

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) {
        setIntroState('hidden');
        setHeadlineActive(true);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Intro Stage sequence
  useEffect(() => {
    if (reducedMotion) return;

    // 0ms -> 220ms -> fades in
    // 1500ms -> lifts out
    const liftTimer = setTimeout(() => {
      setIntroState('lifting');
    }, 1500);

    // 2050ms -> hide intro stage and trigger headline stagger
    const hideTimer = setTimeout(() => {
      setIntroState('hidden');
      setHeadlineActive(true);
    }, 2050);

    return () => {
      clearTimeout(liftTimer);
      clearTimeout(hideTimer);
    };
  }, [reducedMotion]);

  // Scroll reveal observer
  useEffect(() => {
    if (reducedMotion) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );

    const revealElements = document.querySelectorAll('.reveal-block');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reducedMotion]);

  // WebGL Hero Shader (with Canvas 2D fallback)
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = heroCanvasRef.current;
    if (!canvas) return;

    let animId: number;
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl');
    } catch (e) {
      gl = null;
    }

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    if (gl) {
      // Vertex Shader
      const vsSource = `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      // Fragment Shader: Three horizontal ribbons (indigo, violet, cyan) with additive blending
      const fsSource = `
        precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          float x = uv.x * 6.28318;
          float t = u_time * 0.7;

          // Ribbon 1: Indigo (#6366F1 = vec3(0.388, 0.400, 0.945))
          float y1 = 0.52 + 0.16 * sin(x * 0.9 + t * 0.8) + 0.08 * sin(x * 1.8 + t * 1.3);
          float d1 = abs(uv.y - y1);
          float r1 = smoothstep(0.12, 0.0, d1);
          vec3 c1 = vec3(0.388, 0.400, 0.945) * r1;

          // Ribbon 2: Violet (#8B5CF6 = vec3(0.545, 0.360, 0.965))
          float y2 = 0.48 + 0.14 * sin(x * 1.3 - t * 0.9 + 1.5) + 0.09 * sin(x * 0.7 + t * 0.5);
          float d2 = abs(uv.y - y2);
          float r2 = smoothstep(0.11, 0.0, d2);
          vec3 c2 = vec3(0.545, 0.360, 0.965) * r2;

          // Ribbon 3: Cyan (#06B6D4 = vec3(0.024, 0.714, 0.831))
          float y3 = 0.45 + 0.18 * sin(x * 1.1 + t * 1.1 + 3.1) + 0.06 * sin(x * 2.1 - t * 0.6);
          float d3 = abs(uv.y - y3);
          float r3 = smoothstep(0.13, 0.0, d3);
          vec3 c3 = vec3(0.024, 0.714, 0.831) * r3;

          // Soft center glow
          float centerGlow = (r1 * r2 + r2 * r3 + r1 * r3) * 1.6;
          vec3 bloom = vec3(0.9, 0.95, 1.0) * centerGlow;

          // Additive composite
          vec3 col = c1 + c2 + c3 + bloom;
          float alpha = clamp(r1 + r2 + r3 + centerGlow, 0.0, 0.92);

          gl_FragColor = vec4(col, alpha);
        }
      `;

      const createShader = (type: number, src: string) => {
        const s = gl!.createShader(type)!;
        gl!.shaderSource(s, src);
        gl!.compileShader(s);
        return s;
      };

      const prog = gl.createProgram()!;
      gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vsSource));
      gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fsSource));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      const posLoc = gl.getAttribLocation(prog, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const resLoc = gl.getUniformLocation(prog, 'u_resolution');
      const timeLoc = gl.getUniformLocation(prog, 'u_time');

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      let start = performance.now();
      const render = (now: number) => {
        if (!gl || !canvas) return;
        const elapsed = (now - start) * 0.001;
        gl.uniform2f(resLoc, canvas.width, canvas.height);
        gl.uniform1f(timeLoc, elapsed);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animId = requestAnimationFrame(render);
      };
      animId = requestAnimationFrame(render);
    } else {
      // Canvas 2D Fallback
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let t = 0;
        const render2D = () => {
          t += 0.015;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'lighter';

          const drawSine = (color: string, yMid: number, f1: number, f2: number, phase: number) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 18;
            ctx.lineCap = 'round';
            for (let x = 0; x <= canvas.width; x += 6) {
              const u = (x / canvas.width) * Math.PI * 2;
              const y = yMid + Math.sin(u * f1 + t + phase) * 60 + Math.sin(u * f2 - t * 0.7) * 30;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          };

          const mid = canvas.height * 0.5;
          drawSine('rgba(99, 102, 241, 0.45)', mid - 20, 1.0, 1.8, 0);
          drawSine('rgba(139, 92, 246, 0.45)', mid, 1.4, 0.8, 1.5);
          drawSine('rgba(6, 182, 212, 0.40)', mid + 20, 1.1, 2.1, 3.1);

          animId = requestAnimationFrame(render2D);
        };
        animId = requestAnimationFrame(render2D);
      }
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  // Band 01: Four Engine Tile Canvases
  useEffect(() => {
    if (reducedMotion) return;

    // Tile 1: Travelling Waveform
    let id1: number;
    const c1 = tile1Ref.current;
    if (c1) {
      const ctx1 = c1.getContext('2d');
      let t1 = 0;
      const drawTile1 = () => {
        t1 += 0.035;
        const w = c1.width;
        const h = c1.height;
        if (ctx1) {
          ctx1.clearRect(0, 0, w, h);
          ctx1.beginPath();
          ctx1.strokeStyle = '#6366F1';
          ctx1.lineWidth = 1.8;
          for (let x = 0; x <= w; x += 3) {
            const envelope = Math.sin((x / w) * Math.PI);
            const y = h / 2 + Math.sin(x * 0.08 - t1 * 2) * envelope * 24;
            if (x === 0) ctx1.moveTo(x, y);
            else ctx1.lineTo(x, y);
          }
          ctx1.stroke();
        }
        id1 = requestAnimationFrame(drawTile1);
      };
      id1 = requestAnimationFrame(drawTile1);
    }

    // Tile 2: Denoising / Capability Block Grid
    let id2: number;
    const c2 = tile2Ref.current;
    if (c2) {
      const ctx2 = c2.getContext('2d');
      let t2 = 0;
      const drawTile2 = () => {
        t2 += 0.04;
        const w = c2.width;
        const h = c2.height;
        if (ctx2) {
          ctx2.clearRect(0, 0, w, h);
          const cols = 8;
          const rows = 2;
          const blockW = (w - (cols - 1) * 3) / cols;
          const blockH = (h - (rows - 1) * 4) / rows;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const alpha = 0.15 + 0.75 * Math.abs(Math.sin(t2 + (c * 0.6) + (r * 1.2)));
              ctx2.fillStyle = `rgba(99, 102, 241, ${alpha})`;
              ctx2.fillRect(c * (blockW + 3), r * (blockH + 4), blockW, blockH);
            }
          }
        }
        id2 = requestAnimationFrame(drawTile2);
      };
      id2 = requestAnimationFrame(drawTile2);
    }

    // Tile 3: Four Separated Attack Stem Lines
    let id3: number;
    const c3 = tile3Ref.current;
    if (c3) {
      const ctx3 = c3.getContext('2d');
      let t3 = 0;
      const drawTile3 = () => {
        t3 += 0.025;
        const w = c3.width;
        const h = c3.height;
        if (ctx3) {
          ctx3.clearRect(0, 0, w, h);
          const freqs = [0.05, 0.08, 0.11, 0.14];
          const opacities = [0.35, 0.55, 0.75, 1.0];
          for (let i = 0; i < 4; i++) {
            const yBase = (h / 5) * (i + 1);
            ctx3.beginPath();
            ctx3.strokeStyle = i === 3 ? '#6366F1' : `rgba(255, 255, 255, ${opacities[i] * 0.4})`;
            ctx3.lineWidth = 1.2;
            for (let x = 0; x <= w; x += 4) {
              const y = yBase + Math.sin(x * freqs[i] + t3 * (i + 1)) * 6;
              if (x === 0) ctx3.moveTo(x, y);
              else ctx3.lineTo(x, y);
            }
            ctx3.stroke();
          }
        }
        id3 = requestAnimationFrame(drawTile3);
      };
      id3 = requestAnimationFrame(drawTile3);
    }

    // Tile 4: Sweeping Context & Perimeter Ring
    let id4: number;
    const c4 = tile4Ref.current;
    if (c4) {
      const ctx4 = c4.getContext('2d');
      let angle = 0;
      const drawTile4 = () => {
        angle += 0.045;
        const w = c4.width;
        const h = c4.height;
        const cx = w / 2;
        const cy = h / 2;
        const r = 26;
        if (ctx4) {
          ctx4.clearRect(0, 0, w, h);
          // Base static ring
          ctx4.beginPath();
          ctx4.arc(cx, cy, r, 0, Math.PI * 2);
          ctx4.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx4.lineWidth = 1.5;
          ctx4.stroke();

          // Sweeping arc
          ctx4.beginPath();
          ctx4.arc(cx, cy, r, angle, angle + 1.4);
          ctx4.strokeStyle = '#6366F1';
          ctx4.lineWidth = 2.5;
          ctx4.stroke();

          // Center dot
          ctx4.beginPath();
          ctx4.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx4.fillStyle = '#6366F1';
          ctx4.fill();
        }
        id4 = requestAnimationFrame(drawTile4);
      };
      id4 = requestAnimationFrame(drawTile4);
    }

    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
      cancelAnimationFrame(id3);
      cancelAnimationFrame(id4);
    };
  }, [reducedMotion]);

  // Band 02: Spectrum Field (72 bars + marked active band)
  useEffect(() => {
    if (reducedMotion) return;
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;

    let animId: number;
    const ctx = canvas.getContext('2d');
    let t = 0;
    let isIntersecting = true;

    // IntersectionObserver to gate execution
    const obs = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
    });
    obs.observe(canvas);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const totalBars = 72;
    const startSelected = Math.floor(totalBars * 0.16); // ~12
    const endSelected = Math.floor(totalBars * 0.44);   // ~32

    const renderSpectrum = () => {
      if (isIntersecting && ctx && canvas.width > 0) {
        t += 0.03;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const w = canvas.width;
        const h = canvas.height;
        const barWidth = (w - (totalBars - 1) * 2) / totalBars;

        // Calculate active marker box dimensions
        const markerLeft = startSelected * (barWidth + 2) - 4;
        const markerRight = endSelected * (barWidth + 2) + barWidth + 4;
        const markerW = markerRight - markerLeft;
        const markerTop = h * 0.12;
        const markerH = h * 0.76;

        // Draw marker rectangle
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(markerLeft, markerTop, markerW, markerH);

        // Draw all 72 bars
        for (let i = 0; i < totalBars; i++) {
          const x = i * (barWidth + 2);
          const u = i / totalBars;
          const envelope = Math.sin(u * Math.PI); // spectral half-sine
          const osc = Math.abs(Math.sin(u * 12 + t * 2) + Math.cos(u * 6 - t * 1.5)) * 0.5;

          const isSelected = i >= startSelected && i <= endSelected;
          let barH = h * 0.65 * envelope * (0.35 + 0.65 * osc);

          if (isSelected) {
            // Lifted clear of envelope inside marker
            barH = Math.max(barH * 1.45, h * 0.55);
            ctx.fillStyle = '#6366F1';
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
          }

          const y = h - barH - 8;
          ctx.fillRect(x, y, barWidth, barH);
        }

        // Live Hz & score readout update occasionally
        if (Math.random() < 0.05) {
          const hz = (380 + Math.sin(t) * 75).toFixed(1);
          setLiveReadout(`FREQ ${hz} HZ // GAIN +41.0 PTS // SSRF-PIVOT ACTIVE`);
        }
      }
      animId = requestAnimationFrame(renderSpectrum);
    };

    animId = requestAnimationFrame(renderSpectrum);

    return () => {
      cancelAnimationFrame(animId);
      obs.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  // Headline character staggering with unbreakable words
  const headlineWords = ['attack', 'paths', 'broken', 'before', 'breach.'];
  let charCounter = 0;
  const wordTokens = headlineWords.map((word) => {
    const chars = word.split('').map((char) => ({
      char,
      index: charCounter++,
    }));
    return { word, chars };
  });

  return (
    <div className="bg-[#0A0A0A] text-[#FFFFFF] min-h-screen selection:bg-[#6366F1] selection:text-white font-sans antialiased relative">
      {/* 1. INTRO STAGE */}
      {introState !== 'hidden' && (
        <div
          className={`fixed inset-0 bg-[#0A0A0A] z-[9999] flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
            introState === 'lifting' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div
            className={`text-center font-light tracking-[-0.05em] text-white text-[clamp(2.2rem,7vw,5rem)] transition-all duration-700 transform ${
              introState === 'lifting'
                ? '-translate-y-6 opacity-0'
                : 'translate-y-0 opacity-100'
            }`}
          >
            isolated alerts are an illusion.
          </div>
        </div>
      )}

      {/* 2. FIXED TRANSLUCENT NAV */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-white/[0.08] z-50 flex items-center justify-between px-[clamp(20px,5vw,64px)]">
        {/* Wordmark with one word in indigo */}
        <div className="flex items-center gap-2">
          <span className="font-light tracking-tight text-base text-white">
            chained<span className="text-[#6366F1] font-normal">risk</span>
          </span>
          <span className="text-[10px] font-mono tracking-widest text-[#71717A] ml-2 hidden sm:inline-block">
            // CORRELATION PROTOCOL
          </span>
        </div>

        {/* Links & CTA */}
        <div className="flex items-center gap-6 text-xs font-mono tracking-[0.1em] uppercase text-[#71717A]">
          <a href="#engine" className="hover:text-white transition hidden md:inline-block">
            01 Engine
          </a>
          <a href="#spectrum" className="hover:text-white transition hidden md:inline-block">
            02 Spectrum
          </a>
          <a href="#chamber" className="hover:text-white transition hidden md:inline-block">
            03 Chamber
          </a>
          <a href="#demask" className="hover:text-white transition hidden md:inline-block">
            04 Demask
          </a>
          <a href="#stats" className="hover:text-white transition hidden md:inline-block">
            05 Metrics
          </a>
          <a href="#faq" className="hover:text-white transition hidden md:inline-block">
            06 FAQ
          </a>

          <button
            onClick={onLaunchApp}
            className="px-4 py-2 bg-[#6366F1] hover:bg-[#4338CA] active:bg-[#3730A3] text-white text-[11px] font-mono tracking-[0.1em] uppercase transition cursor-pointer"
          >
            Launch Console
          </button>
        </div>
      </nav>

      {/* 3. SHADER RIBBON HERO */}
      <header className="relative min-h-[100svh] w-full overflow-hidden flex flex-col justify-end pt-24 pb-[clamp(32px,6vw,72px)] px-[clamp(20px,5vw,64px)]">
        {/* Background Full-bleed Canvas */}
        <canvas
          ref={heroCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Downward linear gradient veil + radial vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,10,10,0.15) 15%, rgba(10,10,10,0.85) 75%, rgba(10,10,10,0.98) 100%), radial-gradient(circle at center, rgba(10,10,10,0) 25%, rgba(10,10,10,0.7) 100%)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 max-w-[1152px] w-full mx-auto space-y-6">
          {/* Hairline-ruled mono metadata row */}
          <div className="border-t border-b border-white/10 py-2.5 flex flex-wrap items-center justify-between text-[11px] font-mono tracking-[0.1em] uppercase text-white/75">
            <span>SYS_VER // 2.4.0 · MULTI-STAGE CORRELATOR</span>
            <span className="hidden sm:inline-block">HITL BLAST-RADIUS VERIFIED</span>
            <span>LAB SCOPE: 10.77.0.0/24</span>
          </div>

          {/* Staggered Rising Headline + Interactive CrystalizedBall Orb */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-[clamp(2.75rem,8.5vw,9.5rem)] leading-[0.92] font-light tracking-[-0.04em] text-white py-1">
                {wordTokens.map((wt, wIdx) => (
                  <span key={wIdx} className="inline-block whitespace-nowrap mr-[0.28em] last:mr-0 overflow-hidden py-1">
                    {wt.chars.map(({ char, index }) => (
                      <span
                        key={index}
                        className="inline-block transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{
                          transform:
                            headlineActive || reducedMotion
                              ? 'translateY(0)'
                              : 'translateY(110%)',
                          transitionDelay: `${index * 42}ms`,
                        }}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                ))}
              </h1>
            </div>

            {/* Interactive Crystalized Core Orb in Hero */}
            <div className="hidden lg:flex flex-col items-center flex-shrink-0 w-[240px] h-[240px] xl:w-[280px] xl:h-[280px] relative mb-2">
              <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
                <CrystalizedBall
                  preset="plasma"
                  color="#6366F1"
                  size={0.78}
                  crackle={0.85}
                  fill={0.5}
                  interactive
                  hoverStrength={0.75}
                  theme="dark"
                />
              </div>
              <div className="text-[10px] font-mono tracking-[0.1em] text-[#71717A] mt-1 uppercase">
                // HOVER TO STIR BLAST RADIUS
              </div>
            </div>
          </div>

          {/* 38ch Paragraph & Two Buttons */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
            <p className="max-w-[38ch] text-[15px] leading-[1.7] text-[#71717A] font-light">
              Synthesize fragmented scanner telemetry into deterministic multi-stage attack chains.
              Quantify composite blast radius and verify reachability inside isolated lab sandboxes
              with cryptographic human authorization.
            </p>

            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={onLaunchApp}
                className="px-6 py-3.5 bg-[#6366F1] hover:bg-[#4338CA] active:bg-[#3730A3] text-white text-[11px] font-mono tracking-[0.1em] uppercase transition cursor-pointer"
              >
                Launch Console
              </button>
              <button
                onClick={() => {
                  if (onExploreScenario) onExploreScenario();
                  else onLaunchApp();
                }}
                className="px-6 py-3.5 bg-transparent border border-white/10 hover:border-white/30 text-white text-[11px] font-mono tracking-[0.1em] uppercase transition cursor-pointer"
              >
                Explore Lab Scenario
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1152px] mx-auto px-[clamp(20px,5vw,64px)] space-y-28 py-20">
        {/* ========================================================= */}
        {/* BAND 01: ENGINE TILES WITH PER-TILE CANVASES */}
        {/* ========================================================= */}
        <section id="engine" className="reveal-block space-y-8">
          {/* Eyebrow & Hairline */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono tracking-[0.1em] uppercase text-[#71717A] whitespace-nowrap">
              01 · Correlation Engine
            </span>
            <div className="h-[1px] bg-white/10 flex-1"></div>
          </div>

          {/* Two-column head */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <h2 className="text-[clamp(2rem,4.6vw,3.6rem)] font-light tracking-[-0.04em] leading-[1.05] max-w-[20ch] text-white">
              Deterministic unification of scattered signals.
            </h2>
            <p className="text-[15px] leading-[1.7] text-[#71717A] font-light">
              Standalone vulnerability scanners generate hundreds of disconnected findings. ChainedRisk maps preconditions to postconditions across network boundaries, computing reachable exploitation paths.
            </p>
          </div>

          {/* 4-Track Grid over Hairline Gaps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white/10 gap-[1px] border border-white/10">
            {/* Tile 01 */}
            <div className="bg-[#0A0A0A] p-6 space-y-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <canvas ref={tile1Ref} width={140} height={74} className="w-[140px] h-[74px]" />
                <span className="text-[11px] font-mono text-[#71717A] tracking-[0.1em]">[01]</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-[17px] font-light text-white tracking-tight">Graph Correlator</h3>
                <p className="text-[13px] leading-[1.6] text-[#71717A] line-clamp-3">
                  Traverses network topology to connect external entry points to internal jewels.
                </p>
              </div>
            </div>

            {/* Tile 02 */}
            <div className="bg-[#0A0A0A] p-6 space-y-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <canvas ref={tile2Ref} width={140} height={74} className="w-[140px] h-[74px]" />
                <span className="text-[11px] font-mono text-[#71717A] tracking-[0.1em]">[02]</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-[17px] font-light text-white tracking-tight">Capability Matrix</h3>
                <p className="text-[13px] leading-[1.6] text-[#71717A] line-clamp-3">
                  Matches prerequisites to guarantees: unauth reads unlock SSRF endpoints.
                </p>
              </div>
            </div>

            {/* Tile 03 */}
            <div className="bg-[#0A0A0A] p-6 space-y-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <canvas ref={tile3Ref} width={140} height={74} className="w-[140px] h-[74px]" />
                <span className="text-[11px] font-mono text-[#71717A] tracking-[0.1em]">[03]</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-[17px] font-light text-white tracking-tight">Attack Synthesizer</h3>
                <p className="text-[13px] leading-[1.6] text-[#71717A] line-clamp-3">
                  Constructs chained multi-step sequences from recon to code execution.
                </p>
              </div>
            </div>

            {/* Tile 04 */}
            <div className="bg-[#0A0A0A] p-6 space-y-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <canvas ref={tile4Ref} width={140} height={74} className="w-[140px] h-[74px]" />
                <span className="text-[11px] font-mono text-[#71717A] tracking-[0.1em]">[04]</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-[17px] font-light text-white tracking-tight">Blast-Radius Gate</h3>
                <p className="text-[13px] leading-[1.6] text-[#71717A] line-clamp-3">
                  Constrains verification probes to isolated subnets under HMAC signatures.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BAND 02: THE SPECTRUM FIELD (THE SEVERITY ILLUSION) */}
        {/* ========================================================= */}
        <section id="spectrum" className="reveal-block space-y-8">
          {/* Eyebrow & Hairline */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono tracking-[0.1em] uppercase text-[#71717A] whitespace-nowrap">
              02 · The Severity Illusion
            </span>
            <div className="h-[1px] bg-white/10 flex-1"></div>
          </div>

          {/* Two-column head */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <h2 className="text-[clamp(2rem,4.6vw,3.6rem)] font-light tracking-[-0.04em] leading-[1.05] max-w-[20ch] text-white">
              Low individual CVSS, critical compound risk.
            </h2>
            <p className="text-[15px] leading-[1.7] text-[#71717A] font-light">
              Conventional vulnerability management evaluates findings in isolation. An exposed .git repository (CVSS 5.3) combined with an internal SSRF proxy turns harmless low-priority noise into complete database compromise.
            </p>
          </div>

          {/* Full-width Bordered Spectrum Field */}
          <div className="relative border border-white/10 p-6 bg-[#0F0F11] overflow-hidden">
            <div className="h-[clamp(200px,32vw,340px)] w-full">
              <canvas ref={spectrumCanvasRef} className="w-full h-full" />
            </div>

            {/* Bottom Furniture */}
            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/[0.08] text-[11px] font-mono tracking-[0.1em] text-[#71717A]">
              <span>BAND: SSRF PIVOT · ISOLATED MED ⟶ CHAIN GAIN +41 PTS</span>
              <span className="text-[#6366F1] font-normal">{liveReadout}</span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* INTERACTIVE CRYSTALIZED BALL: BLAST RADIUS PLASMA CHAMBER */}
        {/* ========================================================= */}
        <section id="chamber" className="reveal-block space-y-8">
          {/* Eyebrow & Hairline */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono tracking-[0.1em] uppercase text-[#71717A] whitespace-nowrap">
              03 · Blast Radius Plasma Chamber
            </span>
            <div className="h-[1px] bg-white/10 flex-1"></div>
          </div>

          {/* Two-column head */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <h2 className="text-[clamp(2rem,4.6vw,3.6rem)] font-light tracking-[-0.04em] leading-[1.05] max-w-[20ch] text-white">
              Tactile containment of chaotic attack energy.
            </h2>
            <p className="text-[15px] leading-[1.7] text-[#71717A] font-light">
              Interactive WebGL plasma sphere powered by OGL. Electric rim strands, traveling flares, dust particles, and dynamic discharge sparks simulate containment boundaries inside isolated lab sandboxes. Click to discharge electric shockwaves; hover to stir particle wake.
            </p>
          </div>

          {/* Interactive Preset Chips & Chamber Panel */}
          <div className="border border-white/10 bg-[#0F0F11] p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-[0.1em] text-[#71717A] uppercase mr-2">CHAMBER PRESET:</span>
                {(['plasma', 'nebula', 'aurora', 'abyss', 'solar', 'ember'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setBallPreset(p)}
                    className={`px-3 py-1 text-[11px] font-mono tracking-[0.1em] uppercase transition cursor-pointer ${
                      ballPreset === p
                        ? 'bg-[#6366F1] text-white shadow-xs font-bold'
                        : 'bg-[#18181B] text-[#71717A] hover:text-white border border-white/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-mono text-[#71717A] tracking-[0.1em] uppercase">
                STATUS: <span className="text-[#6366F1] font-bold">CONTAINED · 15,000 PARTICLES</span>
              </div>
            </div>

            {/* CrystalizedBall Canvas Container */}
            <div className="w-full h-[480px] sm:h-[560px] relative overflow-hidden bg-[#0A0A0A] border border-white/[0.06] flex items-center justify-center cursor-grab active:cursor-grabbing">
              <CrystalizedBall
                preset={ballPreset}
                size={0.72}
                crackle={0.85}
                fill={0.52}
                interactive={true}
                hoverStrength={0.8}
                theme="dark"
              />
              <div className="absolute top-4 left-4 text-[10px] font-mono tracking-widest text-[#71717A] uppercase pointer-events-none">
                CLICK TO DISCHARGE ARCS · HOVER TO STIR PARTICLE FIELD
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BAND 04: HALFTONE REVEAL TELEMETRY DEMASKING */}
        {/* ========================================================= */}
        <section id="demask" className="reveal-block space-y-8">
          {/* Eyebrow & Hairline */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono tracking-[0.1em] uppercase text-[#71717A] whitespace-nowrap">
              04 · Cryptographic Payload Demasking // Screen Matrix
            </span>
            <div className="h-[1px] bg-white/10 flex-1"></div>
          </div>

          {/* Two-column head */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <h2 className="text-[clamp(2rem,4.6vw,3.6rem)] font-light tracking-[-0.04em] leading-[1.05] max-w-[20ch] text-white">
              De-mask obfuscated threat topology in real time.
            </h2>
            <p className="text-[15px] leading-[1.7] text-[#71717A] font-light">
              Attack paths conceal intermediate hops under encoded proxy signatures. Move cursor across the halftone plate to expand dots into raw cryptographic telemetry; click anywhere to broadcast radial energy burst rings across the halftone screen.
            </p>
          </div>

          {/* Interactive Halftone Plate Container */}
          <div className="border border-white/10 bg-[#0F0F11] p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Shape toggles */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-[0.1em] text-[#71717A] uppercase">MARK SHAPE:</span>
                  {(['dot', 'line', 'diamond', 'cross'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setHalftoneShape(s)}
                      className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase transition cursor-pointer ${
                        halftoneShape === s
                          ? 'bg-[#6366F1] text-white font-medium'
                          : 'bg-[#18181B] text-[#71717A] hover:text-white border border-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Mode toggles */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-[0.1em] text-[#71717A] uppercase">PRINT MODE:</span>
                  {(['mono', 'duotone', 'color'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setHalftoneMode(m)}
                      className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase transition cursor-pointer ${
                        halftoneMode === m
                          ? 'bg-[#6366F1] text-white font-medium'
                          : 'bg-[#18181B] text-[#71717A] hover:text-white border border-white/10'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase hidden lg:inline">
                WEBGL2 FRAGMENT DISPERSION // CELL 7PX
              </span>
            </div>

            {/* Halftone Canvas Container */}
            <div className="w-full h-[460px] sm:h-[540px] relative overflow-hidden bg-[#0A0A0A] border border-white/[0.06]">
              <HalftoneReveal
                src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1400&auto=format&fit=crop"
                mode={halftoneMode}
                shape={halftoneShape}
                cellSize={7}
                angle={45}
                dotScale={1.05}
                inkColor="#6366F1"
                accentColor="#A78BFA"
                paperColor="#0A0A0A"
                revealRadius={180}
                softness={0.6}
                linger={1.2}
                clickBurst={true}
                wander={true}
                intro={true}
              />
              <div className="absolute top-4 left-4 text-[10px] font-mono tracking-widest text-white/70 uppercase pointer-events-none flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-ping"></span>
                <span>HOVER TO DE-MASK CIPHERTEXT · CLICK TO SEND RADIAL BURST RING</span>
              </div>
              <div className="absolute bottom-4 right-4 text-[10px] font-mono tracking-widest text-white/40 uppercase pointer-events-none hidden sm:block">
                SCREEN ANGLE: 45° // CELL: 7PX // DUAL PLATE INDIGO/VIOLET
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BAND 05: FOUR-TRACK STAT ROW */}
        {/* ========================================================= */}
        <section id="stats" className="reveal-block space-y-8">
          {/* Eyebrow & Hairline */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono tracking-[0.1em] uppercase text-[#71717A] whitespace-nowrap">
              05 · Verification Telemetry
            </span>
            <div className="h-[1px] bg-white/10 flex-1"></div>
          </div>

          {/* 4-Track Stat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white/10 gap-[1px] border border-white/10">
            {/* Stat 1 */}
            <div className="bg-[#0A0A0A] p-8 space-y-2">
              <div className="text-[clamp(2.2rem,5vw,3.4rem)] font-light leading-none tracking-tight text-white">
                <span className="text-[#6366F1]">98</span>.7%
              </div>
              <p className="text-[12.5px] leading-[1.6] text-[#71717A] font-light">
                Noise reduction vs raw unverified alert exhaust
              </p>
            </div>

            {/* Stat 2 */}
            <div className="bg-[#0A0A0A] p-8 space-y-2">
              <div className="text-[clamp(2.2rem,5vw,3.4rem)] font-light leading-none tracking-tight text-white">
                <span className="text-[#6366F1]">9</span>1/100
              </div>
              <p className="text-[12.5px] leading-[1.6] text-[#71717A] font-light">
                Peak composite attack chain criticality score
              </p>
            </div>

            {/* Stat 3 */}
            <div className="bg-[#0A0A0A] p-8 space-y-2">
              <div className="text-[clamp(2.2rem,5vw,3.4rem)] font-light leading-none tracking-tight text-white">
                <span className="text-[#6366F1]">0</span>
              </div>
              <p className="text-[12.5px] leading-[1.6] text-[#71717A] font-light">
                Invented capabilities admitted (deterministic checks)
              </p>
            </div>

            {/* Stat 4 */}
            <div className="bg-[#0A0A0A] p-8 space-y-2">
              <div className="text-[clamp(2.2rem,5vw,3.4rem)] font-light leading-none tracking-tight text-white">
                <span className="text-[#6366F1]">100</span>%
              </div>
              <p className="text-[12.5px] leading-[1.6] text-[#71717A] font-light">
                Active probes gated by human approval & signed tokens
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BAND 06: BORDERLESS FAQ */}
        {/* ========================================================= */}
        <section id="faq" className="reveal-block space-y-8">
          {/* Eyebrow & Hairline */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono tracking-[0.1em] uppercase text-[#71717A] whitespace-nowrap">
              06 · Protocol Architecture FAQ
            </span>
            <div className="h-[1px] bg-white/10 flex-1"></div>
          </div>

          {/* Details / Summary Accordions with CSS Plus/Minus */}
          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            {/* FAQ 1 */}
            <details className="group py-[22px]">
              <summary className="flex items-center justify-between cursor-pointer list-none text-white text-base font-light tracking-tight group-hover:text-[#6366F1] transition">
                <span>How does the deterministic validator eliminate AI hallucinations?</span>
                <span className="relative w-[13px] h-[13px] flex items-center justify-center flex-shrink-0 text-[#71717A]">
                  <span className="absolute w-[13px] h-[1px] bg-current"></span>
                  <span className="absolute h-[13px] w-[1px] bg-current transition-transform duration-200 group-open:scale-y-0"></span>
                </span>
              </summary>
              <p className="mt-4 text-[14px] leading-[1.7] text-[#71717A] font-light max-w-[70ch]">
                The reasoning engine proposes candidate chains, but every step is strictly verified by graph algorithms. Every cited finding ID must exist in the database, required capabilities must match earlier postconditions, and candidate steps that fail graph connectivity are rejected and archived in the rejected hypotheses log.
              </p>
            </details>

            {/* FAQ 2 */}
            <details className="group py-[22px]">
              <summary className="flex items-center justify-between cursor-pointer list-none text-white text-base font-light tracking-tight group-hover:text-[#6366F1] transition">
                <span>What prevents active verification probes from escaping into production?</span>
                <span className="relative w-[13px] h-[13px] flex items-center justify-center flex-shrink-0 text-[#71717A]">
                  <span className="absolute w-[13px] h-[1px] bg-current"></span>
                  <span className="absolute h-[13px] w-[1px] bg-current transition-transform duration-200 group-open:scale-y-0"></span>
                </span>
              </summary>
              <p className="mt-4 text-[14px] leading-[1.7] text-[#71717A] font-light max-w-[70ch]">
                ChainedRisk enforces a deny-by-default execution policy. Target addresses are hard-locked to the isolated lab CIDR (10.77.0.0/24), runner containers execute with read-only root filesystems and dropped capabilities, and commands require a single-use HMAC-SHA256 authorization token signed by a designated human reviewer.
              </p>
            </details>

            {/* FAQ 3 */}
            <details className="group py-[22px]">
              <summary className="flex items-center justify-between cursor-pointer list-none text-white text-base font-light tracking-tight group-hover:text-[#6366F1] transition">
                <span>How does Graph-Theoretic Min-Cut remediation calculate optimal fixes?</span>
                <span className="relative w-[13px] h-[13px] flex items-center justify-center flex-shrink-0 text-[#71717A]">
                  <span className="absolute w-[13px] h-[1px] bg-current"></span>
                  <span className="absolute h-[13px] w-[1px] bg-current transition-transform duration-200 group-open:scale-y-0"></span>
                </span>
              </summary>
              <p className="mt-4 text-[14px] leading-[1.7] text-[#71717A] font-light max-w-[70ch]">
                Instead of fixing hundreds of individual findings sequentially, ChainedRisk computes the minimum cut in the attack graph. Resolving a single bottleneck—such as adding an internal IP filter to a public proxy endpoint—collapses 100% of attack paths leading to sensitive internal targets.
              </p>
            </details>

            {/* FAQ 4 */}
            <details className="group py-[22px]">
              <summary className="flex items-center justify-between cursor-pointer list-none text-white text-base font-light tracking-tight group-hover:text-[#6366F1] transition">
                <span>Can ChainedRisk export telemetry to standard DevSecOps pipelines?</span>
                <span className="relative w-[13px] h-[13px] flex items-center justify-center flex-shrink-0 text-[#71717A]">
                  <span className="absolute w-[13px] h-[1px] bg-current"></span>
                  <span className="absolute h-[13px] w-[1px] bg-current transition-transform duration-200 group-open:scale-y-0"></span>
                </span>
              </summary>
              <p className="mt-4 text-[14px] leading-[1.7] text-[#71717A] font-light max-w-[70ch]">
                Yes. ChainedRisk natively exports OASIS SARIF 2.1.0 telemetry for GitHub Code Scanning and GitLab Security, along with executive Markdown assessment reports containing full audit receipts and cryptographic ledger hashes.
              </p>
            </details>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CLOSE STATEMENT */}
        {/* ========================================================= */}
        <section className="reveal-block py-16 text-center space-y-8">
          <h2 className="text-[clamp(2.4rem,7vw,5.4rem)] font-light tracking-[-0.04em] leading-[0.95] max-w-[16ch] mx-auto text-white">
            break the path before the breach.
          </h2>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 bg-[#6366F1] hover:bg-[#4338CA] active:bg-[#3730A3] text-white text-[11px] font-mono tracking-[0.1em] uppercase transition cursor-pointer"
            >
              Launch Console
            </button>
            <button
              onClick={() => {
                if (onExploreScenario) onExploreScenario();
                else onLaunchApp();
              }}
              className="px-8 py-4 bg-transparent border border-white/10 hover:border-white/30 text-white text-[11px] font-mono tracking-[0.1em] uppercase transition cursor-pointer"
            >
              View SARIF Spec
            </button>
          </div>
        </section>
      </main>

      {/* 4. FOOTER WITH ELASTIC MESH & DITHER VEIL */}
      <footer className="relative border-t border-white/[0.08] bg-[#0A0A0A] overflow-hidden">
        {/* ElasticMesh Inflatable Brand Sculpture */}
        <div className="reveal-block relative w-full border-b border-white/[0.08] bg-[#0A0A0A] py-8 px-[clamp(20px,5vw,64px)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2 text-[10px] font-mono tracking-[0.14em] uppercase text-[#71717A]">
            <span className="flex items-center gap-2 text-white/80">
              <span className="w-1.5 h-1.5 bg-[#6366F1]"></span>
              // ELASTIC MESH · INFLATABLE ATTACK BARRIER · DRAG TO STRETCH · POKE TO JIGGLE
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#71717A] mr-1 hidden md:inline">SURFACE:</span>
              {(['balloon', 'chrome', 'jelly', 'clay'] as const).map(mat => (
                <button
                  key={mat}
                  onClick={() => setElasticMaterial(mat)}
                  className={`px-2.5 py-1 text-[10px] uppercase font-mono tracking-wider transition cursor-pointer ${
                    elasticMaterial === mat
                      ? 'border border-[#6366F1] text-white bg-[#6366F1]/20'
                      : 'border border-white/10 text-[#71717A] hover:text-white hover:border-white/20'
                  }`}
                >
                  {mat}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full h-[300px] sm:h-[380px] overflow-hidden">
            <ElasticMesh
              text="CHAINEDRISK"
              material={elasticMaterial}
              color="#6366F1"
              inflate={1.05}
              stiffness={0.52}
              wobble={0.62}
              grabRadius={80}
              stretch={0.55}
              press={0.5}
              theme="dark"
              fontFamily="'Inter', system-ui, sans-serif"
              fontWeight={900}
            />
          </div>
        </div>

        {/* DitherVeil Interactive Canvas Container */}
        <div className="relative w-full h-[360px] sm:h-[440px] overflow-hidden border-b border-white/[0.08]">
          <DitherVeil
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1400&auto=format&fit=crop"
            fit="cover"
            pattern="floyd"
            pixelSize={2}
            inkColor="#0A0A0A"
            paperColor="#6366F1"
            rimColor="#A78BFA"
            revealRadius={200}
            softness={0.6}
            linger={1}
            clickBurst={true}
            wander={true}
          />
          {/* Subtle overlay HUD on the Dither Veil */}
          <div className="absolute top-4 left-[clamp(20px,5vw,64px)] right-[clamp(20px,5vw,64px)] flex items-center justify-between pointer-events-none text-[10px] font-mono tracking-[0.14em] uppercase text-white/70">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse"></span>
              <span>// DITHER VEIL · DE-VEIL ATTACK GRAPH · MOVE CURSOR TO DISSOLVE · CLICK TO BURST</span>
            </span>
            <span className="hidden sm:inline text-white/40">
              ALGORITHM: FLOYD-STEINBERG ERROR DIFFUSION
            </span>
          </div>

          <div className="absolute bottom-4 left-[clamp(20px,5vw,64px)] right-[clamp(20px,5vw,64px)] flex items-center justify-between pointer-events-none text-[10px] font-mono tracking-[0.1em] uppercase text-white/50">
            <span>INK: #0A0A0A · PAPER: #6366F1 · RIM: #A78BFA</span>
            <span className="hidden sm:inline">2-BIT ERROR DISPERSION MATRIX</span>
          </div>
        </div>

        {/* Mono Metadata Bar */}
        <div className="py-8 px-[clamp(20px,5vw,64px)] text-[11px] font-mono tracking-[0.1em] uppercase text-[#71717A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>CHAINEDRISK PROTOCOL // LAB NETWORK SPEC 10.77.0.0/24</div>
          <div>APPEND-ONLY SHA-256 AUDIT LEDGER · ZERO HALLUCINATION · 2026</div>
        </div>
      </footer>
    </div>
  );
};

