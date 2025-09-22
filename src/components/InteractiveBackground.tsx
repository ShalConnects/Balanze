import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '../store/themeStore';

const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDarkMode } = useThemeStore();
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation variables
    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      type: 'circle' | 'square' | 'triangle' | 'currency';
      symbol?: string;
      angle: number;
      orbitRadius: number;
      orbitSpeed: number;
    }> = [];

    // Create initial particles
    for (let i = 0; i < 20; i++) {
      const type = ['circle', 'square', 'triangle', 'currency'][Math.floor(Math.random() * 4)] as any;
      const currencySymbols = ['$', '€', '£', '¥'];
      
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3, // Slower movement
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.2 + 0.05, // More subtle
        type,
        symbol: type === 'currency' ? currencySymbols[Math.floor(Math.random() * currencySymbols.length)] : undefined,
        angle: Math.random() * Math.PI * 2, // Random starting angle
        orbitRadius: Math.random() * 80 + 40, // Random orbit radius (40-120px)
        orbitSpeed: (Math.random() - 0.5) * 0.02 + 0.01, // Random orbit speed
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create warm gradient background similar to reference image
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (isDarkMode) {
        // Dark mode: deeper, richer colors
        gradient.addColorStop(0, '#7c2d12'); // Warm orange-red
        gradient.addColorStop(0.3, '#be185d'); // Pink-magenta
        gradient.addColorStop(0.7, '#7c3aed'); // Purple
        gradient.addColorStop(1, '#581c87'); // Deep purple
      } else {
        // Light mode: softer, warmer colors
        gradient.addColorStop(0, '#fed7aa'); // Light peach
        gradient.addColorStop(0.3, '#f9a8d4'); // Light pink
        gradient.addColorStop(0.7, '#c084fc'); // Light purple
        gradient.addColorStop(1, '#a855f7'); // Medium purple
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        // Calculate distance to mouse
        const dx = mousePos.x - particle.x;
        const dy = mousePos.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If close to mouse, orbit around it
        if (distance < 200) {
          // Update orbit angle
          particle.angle += particle.orbitSpeed;
          
          // Calculate new position in orbit
          const targetX = mousePos.x + Math.cos(particle.angle) * particle.orbitRadius;
          const targetY = mousePos.y + Math.sin(particle.angle) * particle.orbitRadius;
          
          // Smoothly move toward orbit position
          particle.x += (targetX - particle.x) * 0.05;
          particle.y += (targetY - particle.y) * 0.05;
        } else {
          // Normal movement when far from mouse
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Bounce off edges
          if (particle.x <= 0 || particle.x >= canvas.width) particle.vx *= -1;
          if (particle.y <= 0 || particle.y >= canvas.height) particle.vy *= -1;
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        
        // Use warm gradient colors for particles that complement the background
        const particleGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        if (isDarkMode) {
          particleGradient.addColorStop(0, '#fbbf24'); // Warm amber
          particleGradient.addColorStop(1, '#ec4899'); // Pink
        } else {
          particleGradient.addColorStop(0, '#f59e0b'); // Amber
          particleGradient.addColorStop(1, '#d946ef'); // Magenta
        }
        ctx.fillStyle = particleGradient;

        if (particle.type === 'circle') {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (particle.type === 'square') {
          ctx.fillRect(particle.x - particle.size, particle.y - particle.size, particle.size * 2, particle.size * 2);
        } else if (particle.type === 'triangle') {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y - particle.size);
          ctx.lineTo(particle.x - particle.size, particle.y + particle.size);
          ctx.lineTo(particle.x + particle.size, particle.y + particle.size);
          ctx.closePath();
          ctx.fill();
        } else if (particle.type === 'currency') {
          // Draw currency symbol
          ctx.fillStyle = isDarkMode ? '#e2e8f0' : '#1e293b';
          ctx.font = `bold ${particle.size * 3}px Arial`; // Increased from 2 to 3 for bigger icons
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(particle.symbol || '$', particle.x, particle.y);
        }

        ctx.restore();
      });

      // Draw subtle grid pattern
      ctx.strokeStyle = isDarkMode ? 'rgba(148, 163, 184, 0.08)' : 'rgba(203, 213, 225, 0.2)';
      ctx.lineWidth = 1;
      const gridSize = 60; // Larger grid for more subtle effect
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [isDarkMode, mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
};

export default InteractiveBackground; 