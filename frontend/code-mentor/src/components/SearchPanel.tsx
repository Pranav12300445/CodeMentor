import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    Search,
    FileCode,
    Loader2,
    AlertCircle,
    Copy,
    Check,
    ChevronDown,
    ChevronRight,
    Hash
} from "lucide-react";

import type {
    Repository,
    SearchResult
} from "../types";

import { searchCode } from "../services/api";


interface Props {
    repository: Repository;
}


const TOP_K_OPTIONS = [5, 10, 20] as const;

const SUGGESTION_QUERIES = [
    "main entry point",
    "authentication logic",
    "database queries",
    "error handling",
    "API endpoints",
    "utility functions",
];


export default function SearchPanel({
    repository
}: Props) {

    const [query, setQuery] =
        useState("");

    const [mode, setMode] =
        useState<"semantic" | "hybrid">("hybrid");

    const [topK, setTopK] =
        useState<number>(10);

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

    const [expandedCards, setExpandedCards] =
        useState<Set<number>>(new Set());

    const [searchTimeMs, setSearchTimeMs] =
        useState<number | null>(null);

    const [lastQuery, setLastQuery] =
        useState("");

    const inputRef =
        useRef<HTMLInputElement>(null);


    // Reset state on repository change
    useEffect(() => {

        setQuery("");
        setResults([]);
        setSearched(false);
        setError(null);
        setExpandedCards(new Set());
        setSearchTimeMs(null);
        setLastQuery("");

        inputRef.current?.focus();

    }, [repository.id]);


    const handleSearch = async () => {

        const trimmed = query.trim();

        if (!trimmed || searching) {
            return;
        }

        setSearching(true);
        setError(null);
        setSearchTimeMs(null);

        const start = performance.now();

        try {

            const response =
                await searchCode(
                    repository.id,
                    trimmed,
                    topK,
                    mode
                );

            const elapsed =
                performance.now() - start;

            setResults(response.results);
            setSearched(true);
            setSearchTimeMs(elapsed);
            setLastQuery(trimmed);

            // Expand first 3 results by default
            const initialExpanded = new Set<number>();
            for (
                let i = 0;
                i < Math.min(3, response.results.length);
                i++
            ) {
                initialExpanded.add(i);
            }
            setExpandedCards(initialExpanded);

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


    const toggleCard = (index: number) => {

        setExpandedCards((prev) => {

            const next = new Set(prev);

            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }

            return next;
        });
    };


    const getScoreColor = (score: number) => {

        if (score >= 0.8) return "#3fb950";
        if (score >= 0.6) return "#58a6ff";
        if (score >= 0.4) return "#d29922";

        return "#8b949e";
    };


    const getDisplayScore = (result: SearchResult) => {

        return result.hybrid_score ??
            result.score ??
            0;
    };


    const handleSuggestion = (text: string) => {

        setQuery(text);

        inputRef.current?.focus();
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
                        ref={inputRef}
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


                <div className="search-options">

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


                    <div className="topk-selector">

                        <span className="topk-label">
                            Results:
                        </span>

                        {TOP_K_OPTIONS.map((k) => (

                            <button
                                key={k}
                                className={`topk-button ${
                                    topK === k
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setTopK(k)
                                }
                            >
                                {k}
                            </button>

                        ))}

                    </div>

                </div>

            </div>


            {error && (

                <div className="search-error">
                    <AlertCircle size={16} />
                    {error}
                </div>

            )}


            {searched &&
                results.length > 0 &&
                !searching && (

                <div className="search-summary">

                    <span>
                        Found <strong>{results.length}</strong> result
                        {results.length !== 1 ? "s" : ""} for
                        {" "}<em>"{lastQuery}"</em>
                    </span>

                    {searchTimeMs != null && (
                        <span className="search-time">
                            {(searchTimeMs / 1000).toFixed(2)}s
                        </span>
                    )}

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

                        <div className="search-suggestions">
                            {SUGGESTION_QUERIES.map(
                                (suggestion) => (
                                    <button
                                        key={suggestion}
                                        className="suggestion-chip"
                                        onClick={() =>
                                            handleSuggestion(
                                                suggestion
                                            )
                                        }
                                    >
                                        {suggestion}
                                    </button>
                                )
                            )}
                        </div>

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
                            "{lastQuery}"
                        </p>

                    </div>

                )}


                {results.map((result, index) => {

                    const displayScore =
                        getDisplayScore(result);

                    const isExpanded =
                        expandedCards.has(index);

                    const scoreColor =
                        getScoreColor(displayScore);

                    return (
                        <div
                            key={index}
                            className={`search-result-card ${
                                isExpanded ? "expanded" : ""
                            }`}
                        >

                            <div
                                className="result-header clickable"
                                onClick={() =>
                                    toggleCard(index)
                                }
                            >

                                <div className="result-file">

                                    <span className="result-rank">
                                        <Hash size={12} />
                                        {index + 1}
                                    </span>

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

                                    <div className="score-display">
                                        <div className="score-bar">
                                            <div
                                                className="score-fill"
                                                style={{
                                                    width: `${displayScore * 100}%`,
                                                    backgroundColor: scoreColor,
                                                }}
                                            />
                                        </div>

                                        <span
                                            className="result-score"
                                            style={{ color: scoreColor }}
                                        >
                                            {(displayScore * 100).toFixed(0)}%
                                        </span>
                                    </div>

                                    <span className="expand-chevron">
                                        {isExpanded
                                            ? <ChevronDown size={16} />
                                            : <ChevronRight size={16} />
                                        }
                                    </span>

                                </div>

                            </div>

                            {isExpanded && (

                                <div className="result-code-wrapper">

                                    <button
                                        className="copy-button"
                                        title="Copy code"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy(
                                                result.code || "",
                                                index
                                            );
                                        }}
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

                            )}

                        </div>
                    );

                })}

            </div>

        </div>
    );
}
