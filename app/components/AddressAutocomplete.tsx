'use client';

import React, { useRef, useEffect } from 'react';

interface AddressAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    className?: string;
}

export default function AddressAutocomplete({
    value,
    onChange,
    onBlur,
    placeholder,
    className,
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.google || !inputRef.current) return;

        if (!autocompleteRef.current) {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'il' },
                fields: ['formatted_address', 'geometry', 'address_components'],
                types: ['address'],
            });

            autocompleteRef.current!.addListener('place_changed', () => {
                const place = autocompleteRef.current?.getPlace();
                if (place?.formatted_address) {
                    onChange(place.formatted_address);
                }
            });
        }
    }, [onChange]);

    return (
        <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            className={className}
            autoComplete="off"
        />
    );
}
