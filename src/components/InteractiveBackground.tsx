import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  num: number;
  colorType: 'cyan' | 'purple' | 'gold';
  pulseSpeed: number;
  pulseTime: number;
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const maxParticles = 25; // Keep it clean and performance friendly
    const connectionDist = 180; // Distance to draw connection line
    const mouse = { x: -1000, y: -1000, active: false };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    resizeCanvas();

    // Initialize particles
    const createParticles = () => {
      particles = [];
      const colorOptions: ('cyan' | 'purple' | 'gold')[] = [
        'cyan',
        'purple',
        'gold',
      ];

      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          // Extremely slow, elegant floating movement
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: 18 + Math.random() * 12,
          num: Math.floor(Math.random() * 45) + 1,
          colorType:
            colorOptions[Math.floor(Math.random() * colorOptions.length)],
          pulseSpeed: 0.01 + Math.random() * 0.02,
          pulseTime: Math.random() * Math.PI * 2,
        });
      }
    };

    createParticles();

    // Color definitions
    const getColorStr = (type: 'cyan' | 'purple' | 'gold', opacity: number) => {
      if (type === 'cyan') return `rgba(0, 240, 255, ${opacity})`;
      if (type === 'purple') return `rgba(189, 0, 255, ${opacity})`;
      return `rgba(234, 179, 8, ${opacity})`; // Gold
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 0. Draw Mouse Ambient Spotlight Glow (Subtle & Elegant)
      if (mouse.active) {
        const mouseGrad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          150,
        );
        mouseGrad.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
        mouseGrad.addColorStop(0.5, 'rgba(189, 0, 255, 0.03)');
        mouseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = mouseGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 150, 0, Math.PI * 2);
        ctx.fill();
      }

      // 1. Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        // Between particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const opacity = (1 - dist / connectionDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Between particle and mouse (Network follow effect)
        if (mouse.active) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mouseConnectionDist = 220;

          if (dist < mouseConnectionDist) {
            const opacity = (1 - dist / mouseConnectionDist) * 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = getColorStr(particles[i].colorType, opacity);
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      }

      // 2. Update and draw particles
      particles.forEach((p) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;
        p.pulseTime += p.pulseSpeed;

        // Bounce boundaries
        if (p.x - p.radius < 0 || p.x + p.radius > canvas.width) p.vx *= -1;
        if (p.y - p.radius < 0 || p.y + p.radius > canvas.height) p.vy *= -1;

        // Soft pulse effect for glowing intensity (Subtle but visible)
        const baseOpacity = 0.14;
        const pulseOpacity = baseOpacity + Math.sin(p.pulseTime) * 0.04;

        // Draw Outer Glow Circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = getColorStr(p.colorType, pulseOpacity * 0.3);
        ctx.fill();

        // Draw Main Circle outline
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.strokeStyle = getColorStr(p.colorType, pulseOpacity * 0.7);
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Draw Inner gradient fill
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, getColorStr(p.colorType, pulseOpacity * 0.5));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw Lotto number in the center
        ctx.font = `600 ${p.radius * 0.75}px "Outfit", "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = getColorStr(p.colorType, pulseOpacity * 1.6);
        ctx.fillText(p.num.toString(), p.x, p.y);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    // Optimization: Stop animating if browser tab is inactive
    let active = true;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        active = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        if (!active) {
          active = true;
          draw();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
