'use client';
import { useEffect } from 'react';

/**
 * @param {string} key - e.g. 'n'
 * @param {() => void} callback 
 * @param {Object} options - { alt: boolean }
 */
export function useHotkeys(key, callback, options = {}) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            const isAlt = options.alt ? event.altKey : true;
            const isTargetKey = event.key.toLowerCase() === key.toLowerCase();

            if (isAlt && isTargetKey) {
                // Prevent default behavior if it's a shortcut
                event.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [key, callback, options.alt]);
}
