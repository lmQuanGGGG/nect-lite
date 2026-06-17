export const getInterestIcon = (interest: string): string => {
  switch (interest) {
    case 'Anime/Manga': return '✦';
    case 'Thể thao': return '🏀';
    case 'Du lịch': return '✈';
    case 'Âm nhạc': return '♪';
    case 'Phim ảnh': return '▣';
    case 'Nấu ăn': return '🍳';
    case 'Sách': return '📖';
    case 'Công nghệ': return '⌘';
    case 'Thời trang': return '◈';
    case 'Nhiếp ảnh': return '📷';
    case 'Gym/Thể hình': return '▰';
    case 'Yoga': return '♢';
    case 'Thiền': return '✿';
    case 'Chạy bộ': return '↗';
    case 'Leo núi': return '▲';
    case 'Podcast': return '◉';
    case 'Game online': return '🎮';
    case 'Boardgame': return '♟';
    case 'Karaoke': return '🎤';
    case 'Viết lách': return '✎';
    case 'Vẽ tranh': return '◒';
    default: return '★';
  }
};
