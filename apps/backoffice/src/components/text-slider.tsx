/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client";

import { useState, useEffect, useCallback } from "react";

interface Slide {
  title: string;
  highlightedWord: string;
  description: string;
}

export default function TextSlider() {
  const slides: Slide[] = [
    {
      title: "Seu assistente jurídico",
      highlightedWord: "inteligente",
      description:
        "Resumos automáticos, pesquisa avançada e insights estratégicos: tudo em um só lugar.",
    },
    {
      title: "Economize tempo com",
      highlightedWord: "automação",
      description:
        "Automatize tarefas repetitivas e foque no que realmente importa para seus clientes.",
    },
    {
      title: "Decisões baseadas em",
      highlightedWord: "dados",
      description:
        "Análise de jurisprudência e previsão de resultados com tecnologia avançada.",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        setIsTransitioning(false);

        // Reset position for the next slide to come from right
        const content = document.querySelector(
          ".text-slider-content",
        ) as HTMLElement;
        if (content) {
          content.style.transition = "none";
          content.style.transform = "translateX(100%)";
          content.style.opacity = "0";

          // Force reflow
          content.offsetHeight;

          // Animate in from right
          content.style.transition = "transform 0.5s ease, opacity 0.5s ease";
          content.style.transform = "translateX(0)";
          content.style.opacity = "1";
        }
      }, 500);
    }
  }, [isTransitioning, slides.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [nextSlide]);

  const goToSlide = (index: number) => {
    if (!isTransitioning && index !== currentSlide) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);

        // Reset position for the next slide to come from right
        const content = document.querySelector(
          ".text-slider-content",
        ) as HTMLElement;
        if (content) {
          content.style.transition = "none";
          content.style.transform = "translateX(100%)";
          content.style.opacity = "0";

          // Force reflow
          content.offsetHeight;

          // Animate in from right
          content.style.transition = "transform 0.5s ease, opacity 0.5s ease";
          content.style.transform = "translateX(0)";
          content.style.opacity = "1";
        }
      }, 500);
    }
  };

  return (
    <div className="text-slider-container">
      <div
        className={`text-slider-content ${
          isTransitioning ? "transitioning" : ""
        }`}
      >
        <h1 className="text-xl">
          {slides[currentSlide].title}{" "}
          <span className="highlighted-word">
            {slides[currentSlide].highlightedWord}
          </span>
        </h1>
        <p className="text-[18px]">{slides[currentSlide].description}</p>
      </div>

      <div className="slider-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`slider-dot ${currentSlide === index ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <style jsx>{`
        .text-slider-container {
          position: relative;
          width: 80%;
          height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          padding: 2rem;
          overflow: hidden;
        }

        .text-slider-content {
          text-align: center;
          max-width: 800px;
          position: absolute;
          left: 0;
          right: 0;
          margin: 0 auto;
          transform: translateX(0);
          transition:
            transform 0.5s ease,
            opacity 0.5s ease;
          opacity: 1;
        }

        .text-slider-content.transitioning {
          transform: translateX(-100%);
          opacity: 0;
        }

        .slider-title {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .highlighted-word {
          color: #4fd1c5;
        }

        .slider-description {
          font-size: 1.2rem;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        .slider-dots {
          position: absolute;
          bottom: 2rem;
          display: flex;
          gap: 0.5rem;
          z-index: 10;
        }

        .slider-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #555;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .slider-dot.active {
          background-color: #4fd1c5;
        }

        .slider-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 1rem;
          opacity: 0;
          transition:
            opacity 0.3s ease,
            color 0.3s ease;
          z-index: 10;
        }

        .text-slider-container:hover .slider-nav {
          opacity: 1;
        }

        .slider-nav:hover {
          color: white;
        }

        .slider-nav.prev {
          left: 1rem;
        }

        .slider-nav.next {
          right: 1rem;
        }
      `}</style>
    </div>
  );
}
