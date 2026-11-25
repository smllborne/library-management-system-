import { useCallback, useEffect, useState } from 'react'
import BookGrid from '../components/BookGrid.jsx'
import GenreFilter from '../components/GenreFilter.jsx'
import SearchBar from '../components/SearchBar.jsx'
import { fetchApi } from '../lib/api.js'

function HomePage({ navigate }) {
  const [genres, setGenres] = useState([])
  const [genreError, setGenreError] = useState('')
  const [genreId, setGenreId] = useState('')
  const [search, setSearch] = useState('')
  const handleSearch = useCallback((value) => setSearch(value), [])

  useEffect(() => {
    const controller = new AbortController()
    fetchApi('/genres', controller.signal)
      .then((result) => {
        if (!Array.isArray(result)) throw new Error('The genre response was not valid.')
        setGenres(result)
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setGenreError(error.message || 'Unable to load genres.')
      })
    return () => controller.abort()
  }, [])

  return (
    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow"><span /> A little more wonder, every day</span>
          <h1>Stories worth<br /><em>staying up for.</em></h1>
          <p>Find your next favorite among the shelves. Good stories have a way of finding us.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-disc" />
          <div className="book-stack stack-back" />
          <div className="book-stack stack-middle" />
          <div className="book-stack stack-front"><span>READ<br />A LITTLE<br />FURTHER</span></div>
          <span className="art-sparkle sparkle-one">✳</span>
          <span className="art-sparkle sparkle-two">✳</span>
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="catalog-heading">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">The collection</span>
            <h2 id="catalog-heading">Browse the shelves</h2>
          </div>
          <span className="catalog-aside">A good book is never far away <span aria-hidden="true">✳</span></span>
        </div>
        <SearchBar onSearch={handleSearch} />
        <div className="filter-heading">
          <span>Find your kind of story</span>
          {genreError && <span className="genre-error" role="status">Genre filters unavailable: {genreError}</span>}
        </div>
        <GenreFilter genres={genres} selectedGenre={genreId} onSelect={setGenreId} />
        <BookGrid genreId={genreId} search={search} navigate={navigate} />
      </section>
    </main>
  )
}

export default HomePage
