import { useEffect, useState } from 'react'
import { fetchApi } from '../lib/api.js'
import BookCard from './BookCard.jsx'

function BookGrid({ genreId, search, navigate }) {
  const [result, setResult] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const requestKey = JSON.stringify([genreId, search, retryCount])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams()
    if (genreId) params.set('genreId', genreId)
    if (search) params.set('search', search)

    fetchApi(`/books${params.size ? `?${params.toString()}` : ''}`, controller.signal)
      .then((result) => {
        if (!Array.isArray(result)) throw new Error('The catalog response was not valid.')
        setResult({
          key: requestKey,
          status: result.length ? 'ready' : 'empty',
          books: result,
        })
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        setResult({
          key: requestKey,
          status: 'error',
          error: requestError.message || 'Unable to load the catalog.',
        })
      })

    return () => controller.abort()
  }, [genreId, search, retryCount, requestKey])

  const currentResult = result?.key === requestKey ? result : null
  const status = currentResult?.status || 'loading'

  if (status === 'loading') {
    return (
      <div className="book-grid" aria-label="Loading books" aria-live="polite">
        {Array.from({ length: 8 }, (_, index) => <div className="book-skeleton" key={index}><span /><i /><i /></div>)}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <section className="state-panel" role="alert">
        <span className="state-icon">!</span>
        <h2>We couldn’t reach the shelves.</h2>
        <p>{currentResult.error} Check your connection and try again.</p>
        <button className="text-button" type="button" onClick={() => setRetryCount((count) => count + 1)}>
          Try again <span aria-hidden="true">→</span>
        </button>
      </section>
    )
  }

  if (status === 'empty') {
    return (
      <section className="state-panel">
        <span className="state-icon">⌕</span>
        <h2>No books found just yet.</h2>
        <p>Try a different title, author, or genre to uncover something new.</p>
      </section>
    )
  }

  return (
    <div className="book-grid">
      {currentResult.books.map((book) => (
        <BookCard key={book.id} book={book} onOpen={(id) => navigate(`/books/${id}`)} />
      ))}
    </div>
  )
}

export default BookGrid
