"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export function InteractiveNebulaShader({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25)); // Optimized pixel ratio for better performance
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(2, 2);
    
    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        varying vec2 vUv;

        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = .5;
            float frequency = 0.;
            // OPTIMIZED: Reduced FBM iterations from 6 to 3 for significantly better FPS
            for (int i = 0; i < 3; i++) {
                value += amplitude * noise(st);
                st *= 2.;
                amplitude *= .5;
            }
            return value;
        }

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            st.x *= u_resolution.x / u_resolution.y;

            vec2 mouse = u_mouse.xy / u_resolution.xy;
            mouse.x *= u_resolution.x / u_resolution.y;
            
            float dist = distance(st, mouse);
            float interact = smoothstep(0.4, 0.0, dist) * 0.5;

            vec2 q = vec2(0.);
            q.x = fbm(st + 0.00 * u_time);
            q.y = fbm(st + vec2(1.0));

            vec2 r = vec2(0.);
            r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time);
            r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time);

            float f = fbm(st + r + interact);

            vec3 color = mix(
                vec3(0.0, 0.0, 0.05),
                vec3(0.1, 0.0, 0.2),
                clamp((f * f) * 4.0, 0.0, 1.0)
            );

            color = mix(
                color,
                vec3(0.2, 0.1, 0.5),
                clamp(length(q), 0.0, 1.0)
            );

            color = mix(
                color,
                vec3(0.3, 0.1, 0.7),
                clamp(length(r.x), 0.0, 1.0)
            );

            gl_FragColor = vec4((f * f * f + .6 * f * f + .5 * f) * color, 1.0);
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const onWindowResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };

    const onMouseMove = (event: MouseEvent) => {
      uniforms.u_mouse.value.set(event.clientX, window.innerHeight - event.clientY);
    };

    window.addEventListener("resize", onWindowResize);
    window.addEventListener("mousemove", onMouseMove);

    const startTime = performance.now();
    
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      uniforms.u_time.value = (performance.now() - startTime) / 1000;
      renderer.render(scene, camera);
    };
    
    animate();

    return () => {
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      material.dispose();
      geometry.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`fixed inset-0 z-[-1] pointer-events-none ${className || ''}`}
    />
  );
}
