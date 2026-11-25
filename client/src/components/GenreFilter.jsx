function GenreFilter({ genres, selectedGenre, onSelect }) {
  return (
    <div className="genre-list" aria-label="Filter books by genre">
      <button
        className={`genre-chip${selectedGenre === '' ? ' is-active' : ''}`}
        type="button"
        aria-pressed={selectedGenre === ''}
        onClick={() => onSelect('')}
      >
        All books
      </button>
      {genres.map((genre) => (
        <button
          className={`genre-chip${selectedGenre === String(genre.id) ? ' is-active' : ''}`}
          type="button"
          aria-pressed={selectedGenre === String(genre.id)}
          key={genre.id}
          onClick={() => onSelect(String(genre.id))}
        >
          {genre.name}
        </button>
      ))}
    </div>
  )
}

export default GenreFilter
