import { Lesson } from './types';

const getStableWikiUrl = (char: string) => {
    const charUpper = char.toUpperCase();
    return `https://commons.wikimedia.org/wiki/Special:FilePath/Sign_language_${charUpper}.svg?width=500`;
};

export const ALPHABET_LESSONS: Lesson[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map((char) => ({
    id: `alpha-${char}`,
    category: 'alphabet',
    type: (char === 'J' || char === 'Z') ? 'dynamic' : 'static',
    letter: char,
    description: char === 'J' ? "Trace a 'J' in the air." : char === 'Z' ? "Trace a 'Z' in the air." : `Sign for letter ${char}`,
    imageUrl: getStableWikiUrl(char),
    difficulty: ['A', 'B', 'C', 'E', 'F', 'I', 'L', 'O', 'U', 'V'].includes(char) ? 'Easy' : 'Medium',
    visualGuide: char === 'J' ? 'motion_circle' : char === 'Z' ? 'motion_shake' : 'none'
}));

export const PHRASE_LESSONS: Lesson[] = [
    { id: 'p1', category: 'phrase', type: 'dynamic', letter: 'Thank You', description: 'Hand moves from chin forward.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Thank+You&font=roboto', difficulty: 'Easy', visualGuide: 'motion_forward' },
    { id: 'p2', category: 'phrase', type: 'dynamic', letter: 'Please', description: 'Circular motion on chest.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Please&font=roboto', difficulty: 'Easy', visualGuide: 'motion_circle' },
    { id: 'p3', category: 'phrase', type: 'dynamic', letter: 'Help', description: 'Fist on palm, lifting up.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Help&font=roboto', difficulty: 'Medium', visualGuide: 'motion_up' },
    { id: 'p4', category: 'phrase', type: 'dynamic', letter: 'Yes', description: 'Fist nodding like a head.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Yes&font=roboto', difficulty: 'Easy', visualGuide: 'motion_nod' },
    { id: 'p5', category: 'phrase', type: 'dynamic', letter: 'No', description: 'Index/Middle tap thumb.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=No&font=roboto', difficulty: 'Easy', visualGuide: 'motion_shake' },
    { id: 'p6', category: 'phrase', type: 'dynamic', letter: 'Hello', description: 'Salute from forehead.', imageUrl: 'https://placehold.co/600x600/18181b/FFFFFF/png?text=Hello&font=roboto', difficulty: 'Easy', visualGuide: 'motion_forward' },
];
