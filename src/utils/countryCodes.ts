export interface CountryCode {
    code: string;
    country: string;
    iso: string;
    flag: string;
}

export const countryCodes: CountryCode[] = [
    { code: '+1', country: 'United States', iso: 'us', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', iso: 'gb', flag: '🇬🇧' },
    { code: '+91', country: 'India', iso: 'in', flag: '🇮🇳' },
    { code: '+86', country: 'China', iso: 'cn', flag: '🇨🇳' },
    { code: '+55', country: 'Brazil', iso: 'br', flag: '🇧🇷' },
    { code: '+81', country: 'Japan', iso: 'jp', flag: '🇯🇵' },
    { code: '+49', country: 'Germany', iso: 'de', flag: '🇩🇪' },
    { code: '+33', country: 'France', iso: 'fr', flag: '🇫🇷' },
    { code: '+61', country: 'Australia', iso: 'au', flag: '🇦🇺' },
    { code: '+39', country: 'Italy', iso: 'it', flag: '🇮🇹' },
    { code: '+34', country: 'Spain', iso: 'es', flag: '🇪🇸' },
    { code: '+82', country: 'South Korea', iso: 'kr', flag: '🇰🇷' },
    { code: '+7', country: 'Russia', iso: 'ru', flag: '🇷🇺' },
    { code: '+52', country: 'Mexico', iso: 'mx', flag: '🇲🇽' },
    { code: '+62', country: 'Indonesia', iso: 'id', flag: '🇮🇩' },
    { code: '+90', country: 'Turkey', iso: 'tr', flag: '🇹🇷' },
    { code: '+31', country: 'Netherlands', iso: 'nl', flag: '🇳🇱' },
    { code: '+41', country: 'Switzerland', iso: 'ch', flag: '🇨🇭' },
    { code: '+46', country: 'Sweden', iso: 'se', flag: '🇸🇪' },
    { code: '+48', country: 'Poland', iso: 'pl', flag: '🇵🇱' },
    { code: '+27', country: 'South Africa', iso: 'za', flag: '🇿🇦' },
    { code: '+234', country: 'Nigeria', iso: 'ng', flag: '🇳🇬' },
    { code: '+20', country: 'Egypt', iso: 'eg', flag: '🇪🇬' },
    { code: '+54', country: 'Argentina', iso: 'ar', flag: '🇦🇷' },
    { code: '+57', country: 'Colombia', iso: 'co', flag: '🇨🇴' },
    { code: '+56', country: 'Chile', iso: 'cl', flag: '🇨🇱' },
    { code: '+51', country: 'Peru', iso: 'pe', flag: '🇵🇪' },
    { code: '+58', country: 'Venezuela', iso: 've', flag: '🇻🇪' },
    { code: '+63', country: 'Philippines', iso: 'ph', flag: '🇵🇭' },
    { code: '+84', country: 'Vietnam', iso: 'vn', flag: '🇻🇳' },
    { code: '+66', country: 'Thailand', iso: 'th', flag: '🇹🇭' },
    { code: '+60', country: 'Malaysia', iso: 'my', flag: '🇲🇾' },
    { code: '+65', country: 'Singapore', iso: 'sg', flag: '🇸🇬' },
    { code: '+64', country: 'New Zealand', iso: 'nz', flag: '🇳🇿' },
    { code: '+92', country: 'Pakistan', iso: 'pk', flag: '🇵🇰' },
    { code: '+880', country: 'Bangladesh', iso: 'bd', flag: '🇧🇩' },
    { code: '+94', country: 'Sri Lanka', iso: 'lk', flag: '🇱🇰' },
    { code: '+971', country: 'United Arab Emirates', iso: 'ae', flag: '🇦🇪' },
    { code: '+966', country: 'Saudi Arabia', iso: 'sa', flag: '🇸🇦' },
    { code: '+972', country: 'Israel', iso: 'il', flag: '🇮🇱' },
];

export const getDefaultCountryCode = (): CountryCode => countryCodes[0];

export const findCountryByCode = (phoneNumber: string): CountryCode | undefined => {
    // Sort codes by length descending to match longer codes first (e.g. +880 before +8)
    const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
    return sortedCodes.find(c => phoneNumber.startsWith(c.code));
};
