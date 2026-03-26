export const LABEL_COLORS = [
    { key: 'red',    bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-500',    border: 'border-red-500',    ring: 'ring-red-500/30' },
    { key: 'orange', bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-500', border: 'border-orange-500', ring: 'ring-orange-500/30' },
    { key: 'amber',  bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-500',  border: 'border-amber-500',  ring: 'ring-amber-500/30' },
    { key: 'green',  bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-500',  border: 'border-green-500',  ring: 'ring-green-500/30' },
    { key: 'blue',   bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-500',   border: 'border-blue-500',   ring: 'ring-blue-500/30' },
    { key: 'purple', bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-500', border: 'border-purple-500', ring: 'ring-purple-500/30' },
];

export const getLabelColor = (colorKey) =>
    LABEL_COLORS.find(c => c.key === colorKey) ?? LABEL_COLORS[4]; // default blue
