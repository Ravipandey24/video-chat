"use client";

import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  text: string | string[];
  className?: string;
  speed?: number;
  repeat?: boolean;
  delay?: number;
  cursor?: boolean;
  onComplete?: () => void;
}

export const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  className = "",
  speed = 70,
  repeat = false,
  delay = 1500,
  cursor = true,
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const textArray = Array.isArray(text) ? text : [text];

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isComplete && !repeat) {
      onComplete?.();
      return;
    }

    const currentText = textArray[currentTextIndex];
    
    if (isDeleting) {
      if (displayText.length === 0) {
        setIsDeleting(false);
        setCurrentTextIndex((prevIndex) => 
          (prevIndex + 1) % textArray.length
        );
        timeout = setTimeout(() => {
          setCurrentIndex(0);
        }, delay);
        return;
      }
      
      timeout = setTimeout(() => {
        setDisplayText(currentText.substring(0, displayText.length - 1));
      }, speed / 2);
    } else {
      if (displayText.length === currentText.length) {
        if (textArray.length === 1 && !repeat) {
          setIsComplete(true);
          onComplete?.();
          return;
        }
        
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, delay);
        return;
      }
      
      timeout = setTimeout(() => {
        setDisplayText(currentText.substring(0, currentIndex + 1));
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [
    displayText, 
    currentIndex, 
    isDeleting, 
    currentTextIndex, 
    textArray, 
    speed, 
    delay, 
    repeat, 
    isComplete, 
    onComplete
  ]);

  return (
    <span className={className}>
      {displayText}
      {cursor && !isComplete && (
        <span className="inline-block w-0.5 h-5 ml-1 bg-current animate-blink" />
      )}
    </span>
  );
}; 