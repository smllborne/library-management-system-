import { useState } from 'react'

function BookCard({ book, onOpen }) {
  const [imageFailed, setImageFailed] = useState(false)
  const coverAvailable = book.coverImage && !imageFailed
  const coverStyle = { '--cover-hue': `${(Number(book.id) * 47 + 18) % 360}` }

  return (
    <button className="book-card" type="button" onClick={() => onOpen(book.id)} aria-label={`View ${book.title} by ${book.author}`}>
      <span className={`book-cover${coverAvailable ? ' has-image' : ''}`} style={coverStyle}>
        {coverAvailable
          ? <img src={book.coverImage} alt="" onError={() => setImageFailed(true)} />
          : <span className="cover-placeholder">
              <span className="cover-kicker">{book.genre?.name || 'From the library'}</span>
              <span className="cover-title">{book.title}</span>
              <span className="cover-rule" />
              <span className="cover-author">{book.author}</span>
            </span>}
        <span className={`availability-dot${book.totalCopies > 0 ? '' : ' is-unavailable'}`} aria-hidden="true" />
      </span>
      <span className="book-card-copy">
        <span className="book-genre">{book.genre?.name || 'Library pick'}</span>
        <span className="book-title">{book.title}</span>
        <span className="book-author">{book.author}</span>
      </span>
      <span className="book-card-arrow" aria-hidden="true">↗</span>
    </button>
  )
}

export default BookCard
