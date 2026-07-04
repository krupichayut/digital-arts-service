"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

interface Image {
  src: string;
  alt?: string;
}

interface ZoomParallaxProps {
  images: Image[];
}

export function ZoomParallax({ images }: ZoomParallaxProps) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
  const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);

  const pictures = [
    { src: images[0]?.src, scale: scale4, className: "w-[25vw] h-[25vh]" },
    { src: images[1]?.src, scale: scale5, className: "w-[35vw] h-[30vh] top-[-30vh] left-[5vw]" },
    { src: images[2]?.src, scale: scale6, className: "w-[20vw] h-[45vh] top-[-10vh] left-[-25vw]" },
    { src: images[3]?.src, scale: scale5, className: "w-[25vw] h-[25vh] left-[27.5vw]" },
    { src: images[4]?.src, scale: scale6, className: "w-[20vw] h-[25vh] top-[27.5vh] left-[5vw]" },
    { src: images[5]?.src, scale: scale8, className: "w-[30vw] h-[25vh] top-[27.5vh] left-[-22.5vw]" },
    { src: images[6]?.src, scale: scale9, className: "w-[15vw] h-[15vh] top-[22.5vh] left-[25vw]" },
  ];

  return (
    <div ref={container} className="h-[300vh] relative">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        {pictures.map(({ src, scale, className }, index) => {
          if (!src) return null;
          return (
            <motion.div
              key={index}
              style={{ scale }}
              className="absolute w-full h-full flex items-center justify-center"
            >
              <div className={`relative ${className}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`parallax-image-${index}`}
                  className="object-cover w-full h-full rounded-2xl shadow-2xl"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
