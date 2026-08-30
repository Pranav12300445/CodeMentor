import {
    useState
} from "react";

import {
    Search,
    FileCode,
    Loader2,
    AlertCircle,
    Copy,
    Check
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

    const [copiedIndex, setCopiedIndex] =
        useState<number | null>(null);


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


    const handleCopy = async (
        code: string,
        index: number
    ) => {

        try {

            await navigator.clipboard.writeText(code);

            setCopiedIndex(index);

            setTimeout(() => {
                setCopiedIndex(null);
            }, 2000);

        } catch {
            console.error("Failed to copy");
        }
    };


    const getScoreColor = (score: number) => {

        if (score >= 0.8) return "#3fb950";
        if (score >= 0.6) return "#58a6ff";
        if (score >= 0.4) return "#d29922";

        return "#8b949e";
    };


    const getDisplayScore = (result: SearchResult) => {

        const score =
            result.hybrid_score ??
            result.score ??
            0;

        return score;
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


                {searching && (

                    <div className="search-loading">
                        <Loader2
                            size={24}
                            className="spinning"
                        />
                        <p>Searching codebase...</p>
                    </div>

                )}


                {searched &&
                    results.length === 0 &&
                    !searching && (

                    <div className="search-no-results">

                        <AlertCircle size={24} />

                        <p>
                            No matching code found for
                            "{query}"
                        </p>

                    </div>

                )}


                {results.map((result, index) => {

                    const displayScore =
                        getDisplayScore(result);

                    return (
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

                                    {result.start_line != null && (
                                        <span className="result-lines">
                                            L{result.start_line}
                                            {result.end_line != null &&
                                                result.end_line !== result.start_line &&
                                                `–${result.end_line}`
                                            }
                                        </span>
                                    )}

                                </div>

                                <div className="result-tags">

                                    {result.name && (
                                        <span className="result-tag name">
                                            {result.name}
                                        </span>
                                    )}

                                    <span className="result-tag type">
                                        {result.node_type}
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
                                                displayScore
                                            ),
                                        }}
                                    >
                                        {(displayScore * 100).toFixed(
                                            0
                                        )}
                                        %
                                    </span>

                                </div>

                            </div>

                            <div className="result-code-wrapper">

                                <button
                                    className="copy-button"
                                    title="Copy code"
                                    onClick={() =>
                                        handleCopy(
                                            result.code || "",
                                            index
                                        )
                                    }
                                >
                                    {copiedIndex === index ? (
                                        <Check size={14} />
                                    ) : (
                                        <Copy size={14} />
                                    )}
                                </button>

                                <pre className="result-code">
                                    <code>
                                        {result.code}
                                    </code>
                                </pre>

                            </div>

                        </div>
                    );

                })}

            </div>

        </div>
    );
}
