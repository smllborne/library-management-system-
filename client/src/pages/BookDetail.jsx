import { useEffect, useState } from 'react'
import { fetchApi } from '../lib/api.js'

function BookDetail({ bookId, navigate }) {
  const [result, setResult] = useState(null)
  const [failedCoverId, setFailedCoverId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchApi(`/books/${bookId}`, controller.signal)
      .then((book) => {
        setResult({ bookId, status: 'ready', book })
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        setResult({
          bookId,
          status: 'error',
          error: requestError.message || 'Unable to load this book.',
        })
      })
    return () => controller.abort()
  }, [bookId])

  const currentResult = result?.bookId === bookId ? result : null
  const status = currentResult?.status || 'loading'
  if (status === 'loading') {
    return <main className="detail-state"><span className="loading-mark" />Finding your book...</main>
  }

  if (status === 'error') {
    return (
      <main className="detail-state">
        <span className="state-icon">!</span>
        <h1>We couldn’t find that book.</h1>
        <p>{currentResult.error}</p>
        <button className="text-button" type="button" onClick={() => navigate('/')}>← Back to the collection</button>
      </main>
    )
  }

  const book = currentResult.book
  const coverStyle = { '--cover-hue': `${(Number(book.id) * 47 + 18) % 360}` }
  return (
    <main className="detail-page">
      <button className="back-link" type="button" onClick={() => navigate('/')}>← <span>Back to all books</span></button>
      <article className="detail-layout">
        <div className="detail-cover-wrap">
          <div className="detail-cover" style={coverStyle}>
            {book.coverImage && failedCoverId !== bookId
              ? <img src={book.coverImage} alt={`Cover of ${book.title}`} onError={() => setFailedCoverId(bookId)} />
              : <div className="cover-placeholder">
                  <span className="cover-kicker">{book.genre?.name || 'From the library'}</span>
                  <span className="cover-title">{book.title}</span>
                  <span className="cover-rule" />
                  <span className="cover-author">{book.author}</span>
                </div>}
          </div>
          <span className={`availability-label${book.totalCopies > 0 ? '' : ' is-unavailable'}`}>
            <span /> {book.totalCopies > 0 ? 'In the collection' : 'Currently unavailable'}
          </span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{book.genre?.name || 'A library book'}</span>
          <h1>{book.title}</h1>
          <p className="detail-author">by {book.author}</p>
          <div className="detail-divider" />
          <h2>About this book</h2>
          <p className="detail-description">{book.description || 'A little more about this story is coming soon. Ask a librarian to find out more.'}</p>
          <dl className="book-facts">
            <div><dt>ISBN</dt><dd>{book.isbn}</dd></div>
            <div><dt>Genre</dt><dd>{book.genre?.name || 'Not specified'}</dd></div>
            <div><dt>Copies in collection</dt><dd>{book.totalCopies}</dd></div>
          </dl>
          <button className="detail-cta" type="button" onClick={() => navigate('/')}>Explore more books <span aria-hidden="true">→</span></button>
        </div>
      </article>
    </main>
  )
}

export default BookDetail
