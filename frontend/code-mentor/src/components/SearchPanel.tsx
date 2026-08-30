import {
    useState
} from "react";

import {
    Search,
    FileCode,
    Loader2,
    AlertCircle
} from "lucide-react";

import type {
    Repository,
    SearchResult
} from "../types";

import { searchCode } from "../services/api";


interface Props {
    repository: Repository;
}


export default function SearchPanel({
    repository
}: Props) {

    const [query, setQuery] =
        useState("");

    const [mode, setMode] =
        useState<"semantic" | "hybrid">("hybrid");

    const [results, setResults] =
        useState<SearchResult[]>([]);

    const [searching, setSearching] =
        useState(false);

    const [searched, setSearched] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);


    const handleSearch = async () => {

        const trimmed = query.trim();

        if (!trimmed || searching) {
            return;
        }

        setSearching(true);
        setError(null);

        try {

            const response =
                await searchCode(
                    repository.id,
                    trimmed,
                    10,
                    mode
                );

            setResults(response.results);
            setSearched(true);

        } catch (err) {

            console.error(
                "Search failed:",
                err
            );

            setError(
                "Search failed. Check that the backend is running."
            );

            setResults([]);

        } finally {

            setSearching(false);

        }
    };


    const handleKeyDown = (
        event: React.KeyboardEvent
    ) => {

        if (event.key === "Enter") {
            handleSearch();
        }
    };


    const getScoreColor = (score: number) => {

        if (score >= 0.8) return "#3fb950";
        if (score >= 0.6) return "#58a6ff";
        if (score >= 0.4) return "#d29922";

        return "#8b949e";
    };


    return (
        <div className="search-panel">

            <div className="search-controls">

                <div className="search-bar">

                    <Search
                        size={18}
                        className="search-icon"
                    />

                    <input
                        type="text"
                        className="search-input"
                        value={query}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder={`Search in ${repository.name}...`}
                        disabled={searching}
                    />

                    <button
                        className="primary-button search-submit"
                        onClick={handleSearch}
                        disabled={
                            !query.trim() ||
                            searching
                        }
                    >
                        {searching ? (
                            <Loader2
                                size={16}
                                className="spinning"
                            />
                        ) : (
                            "Search"
                        )}
                    </button>

                </div>


                <div className="search-mode-toggle">

                    <button
                        className={`mode-button ${
                            mode === "hybrid"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setMode("hybrid")
                        }
                    >
                        Hybrid
                    </button>

                    <button
                        className={`mode-button ${
                            mode === "semantic"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setMode("semantic")
                        }
                    >
                        Semantic
                    </button>

                </div>

            </div>


            {error && (

                <div className="search-error">
                    <AlertCircle size={16} />
                    {error}
                </div>

            )}


            <div className="search-results">

                {!searched && !searching && (

                    <div className="search-empty">

                        <Search size={40} />

                        <h3>
                            Search {repository.name}
                        </h3>

                        <p>
                            Find functions, classes, and code
                            patterns using natural language queries.
                        </p>

                    </div>

                )}


                {searched &&
                    results.length === 0 &&
                    !searching && (

                    <div className="search-no-results">

                        <AlertCircle size={24} />

                        <p>
                            No results found for
                            "{query}"
                        </p>

                    </div>

                )}


                {results.map((result, index) => (

                    <div
                        key={index}
                        className="search-result-card"
                    >

                        <div className="result-header">

                            <div className="result-file">

                                <FileCode size={14} />

                                <span className="result-path">
                                    {result.file_path}
                                </span>

                            </div>

                            <div className="result-tags">

                                <span className="result-tag type">
                                    {result.chunk_type}
                                </span>

                                {result.language && (
                                    <span className="result-tag lang">
                                        {result.language}
                                    </span>
                                )}

                                <span
                                    className="result-score"
                                    style={{
                                        color: getScoreColor(
                                            result.score
                                        ),
                                    }}
                                >
                                    {(result.score * 100).toFixed(
                                        0
                                    )}
                                    %
                                </span>

                            </div>

                        </div>

                        <pre className="result-code">
                            <code>
                                {result.content}
                            </code>
                        </pre>

                    </div>

                ))}

            </div>

        </div>
    );
}
