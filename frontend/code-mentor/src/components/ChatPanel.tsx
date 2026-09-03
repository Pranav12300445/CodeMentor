import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";

import {
    Send,
    Bot,
    User,
    ChevronDown,
    ChevronRight,
    FileCode,
    Loader2,
    Copy,
    Check,
    Trash2
} from "lucide-react";

import type {
    ChatMessage,
    Repository
} from "../types";

import { sendChatMessage } from "../services/api";


interface Props {
    repository: Repository;
}


const SUGGESTIONS = [
    "What does this codebase do?",
    "What are the main entry points?",
    "Explain the architecture",
    "Find error handling patterns",
    "What APIs does this expose?",
];


export default function ChatPanel({
    repository
}: Props) {

    const [messages, setMessages] =
        useState<ChatMessage[]>([]);

    const [input, setInput] =
        useState("");

    const [sending, setSending] =
        useState(false);

    const [expandedSources, setExpandedSources] =
        useState<Set<string>>(new Set());

    const [copiedId, setCopiedId] =
        useState<string | null>(null);

    const messagesEndRef =
        useRef<HTMLDivElement>(null);

    const inputRef =
        useRef<HTMLTextAreaElement>(null);


    // Auto-scroll on new messages
    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });

    }, [messages]);


    // Reset on repo change
    useEffect(() => {
        setMessages([]);
        setInput("");
        setExpandedSources(new Set());
    }, [repository.id]);


    // Auto-resize textarea
    const handleInputChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {

            setInput(event.target.value);

            const textarea = event.target;
            textarea.style.height = "auto";
            textarea.style.height =
                Math.min(textarea.scrollHeight, 150) + "px";

        }, []
    );


    const toggleSource = (messageId: string) => {

        setExpandedSources((prev) => {

            const next = new Set(prev);

            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }

            return next;
        });
    };


    const handleCopy = async (
        text: string,
        id: string
    ) => {

        try {

            await navigator.clipboard.writeText(text);

            setCopiedId(id);

            setTimeout(() => {
                setCopiedId(null);
            }, 2000);

        } catch {
            console.error("Failed to copy");
        }
    };


    const handleSend = async () => {

        const trimmed = input.trim();

        if (!trimmed || sending) {
            return;
        }

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmed,
            timestamp: new Date(),
        };

        setMessages((prev) => [
            ...prev,
            userMessage
        ]);

        setInput("");
        setSending(true);

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
        }

        try {

            const response =
                await sendChatMessage(
                    repository.id,
                    trimmed
                );

            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: response.answer,
                sources: response.sources,
                sourceCount: response.source_count,
                timestamp: new Date(),
            };

            setMessages((prev) => [
                ...prev,
                assistantMessage
            ]);

        } catch (error) {

            console.error(
                "Chat failed:",
                error
            );

            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    "Sorry, something went wrong. Please check that the backend is running and try again.",
                timestamp: new Date(),
            };

            setMessages((prev) => [
                ...prev,
                errorMessage
            ]);

        } finally {

            setSending(false);

            inputRef.current?.focus();
        }
    };


    const handleKeyDown = (
        event: React.KeyboardEvent
    ) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            handleSend();
        }
    };


    const handleClearChat = () => {

        setMessages([]);
        setExpandedSources(new Set());

        inputRef.current?.focus();
    };


    const formatTime = (date: Date) => {

        return date.toLocaleTimeString(
            [], { hour: "2-digit", minute: "2-digit" }
        );
    };


    const renderContent = (text: string) => {

        // Split on fenced code blocks
        const parts = text.split(
            /(```[\s\S]*?```)/g
        );

        return parts.map((part, index) => {

            if (part.startsWith("```")) {

                const match = part.match(
                    /```(\w*)\n?([\s\S]*?)```/
                );

                if (match) {

                    const language =
                        match[1] || "text";

                    const code = match[2].trim();

                    const blockId =
                        `code-block-${index}`;

                    return (
                        <div
                            key={index}
                            className="chat-code-block"
                        >
                            <div className="code-block-header">
                                <span>{language}</span>

                                <button
                                    className="copy-code-button"
                                    onClick={() =>
                                        handleCopy(
                                            code,
                                            blockId
                                        )
                                    }
                                    title="Copy code"
                                >
                                    {copiedId === blockId ? (
                                        <>
                                            <Check size={12} />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={12} />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            <pre>
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                }
            }

            // Render text with inline formatting
            return (
                <span key={index}>
                    {renderInlineFormatting(part)}
                </span>
            );
        });
    };


    const renderInlineFormatting = (text: string) => {

        // Process: bold, inline code, bullet lists
        const lines = text.split("\n");

        return lines.map((line, lineIndex) => {

            const trimmedLine = line.trim();

            // Bullet list items
            if (
                trimmedLine.startsWith("- ") ||
                trimmedLine.startsWith("* ") ||
                trimmedLine.startsWith("• ")
            ) {

                return (
                    <div
                        key={lineIndex}
                        className="chat-list-item"
                    >
                        <span className="chat-bullet">
                            •
                        </span>

                        <span>
                            {renderInlineStyles(
                                trimmedLine.slice(2)
                            )}
                        </span>
                    </div>
                );
            }

            // Numbered list items
            const numberedMatch =
                trimmedLine.match(/^(\d+)\.\s+(.+)/);

            if (numberedMatch) {

                return (
                    <div
                        key={lineIndex}
                        className="chat-list-item"
                    >
                        <span className="chat-bullet">
                            {numberedMatch[1]}.
                        </span>

                        <span>
                            {renderInlineStyles(
                                numberedMatch[2]
                            )}
                        </span>
                    </div>
                );
            }

            return (
                <span key={lineIndex}>
                    {lineIndex > 0 && <br />}
                    {renderInlineStyles(line)}
                </span>
            );
        });
    };


    const renderInlineStyles = (text: string) => {

        // Match: **bold**, `inline code`
        const parts = text.split(
            /(\*\*[^*]+\*\*|`[^`]+`)/g
        );

        return parts.map((part, index) => {

            if (
                part.startsWith("**") &&
                part.endsWith("**")
            ) {

                return (
                    <strong key={index}>
                        {part.slice(2, -2)}
                    </strong>
                );
            }

            if (
                part.startsWith("`") &&
                part.endsWith("`")
            ) {

                return (
                    <code
                        key={index}
                        className="inline-code"
                    >
                        {part.slice(1, -1)}
                    </code>
                );
            }

            return part;
        });
    };


    return (
        <div className="chat-panel">

            <div className="chat-messages">

                {messages.length === 0 && (
                    <div className="chat-empty">

                        <Bot size={40} />

                        <h3>
                            Ask about {repository.name}
                        </h3>

                        <p>
                            Ask questions about the codebase
                            and I'll find relevant code to
                            help answer.
                        </p>

                        <div className="chat-suggestions">

                            {SUGGESTIONS.map(
                                (suggestion) => (

                                    <button
                                        key={suggestion}
                                        className="suggestion-chip"
                                        onClick={() =>
                                            setInput(suggestion)
                                        }
                                    >
                                        {suggestion}
                                    </button>

                                )
                            )}

                        </div>

                    </div>
                )}


                {messages.map((message) => (

                    <div
                        key={message.id}
                        className={`chat-message ${message.role}`}
                    >

                        <div className="message-avatar">
                            {message.role === "user"
                                ? <User size={18} />
                                : <Bot size={18} />
                            }
                        </div>

                        <div className="message-body">

                            <div className="message-meta">
                                <span className="message-role">
                                    {message.role === "user"
                                        ? "You"
                                        : "CodeMentor"
                                    }
                                </span>

                                <span className="message-time">
                                    {formatTime(
                                        message.timestamp
                                    )}
                                </span>
                            </div>

                            <div className="message-content">
                                {renderContent(
                                    message.content
                                )}
                            </div>

                            {message.sources &&
                                message.sources.length > 0 && (

                                <div className="message-sources">

                                    <button
                                        className="sources-toggle"
                                        onClick={() =>
                                            toggleSource(
                                                message.id
                                            )
                                        }
                                    >
                                        {expandedSources.has(
                                            message.id
                                        ) ? (
                                            <ChevronDown
                                                size={14}
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={14}
                                            />
                                        )}

                                        {message.sourceCount}{" "}
                                        source
                                        {message.sourceCount !== 1
                                            ? "s"
                                            : ""}
                                    </button>

                                    {expandedSources.has(
                                        message.id
                                    ) && (

                                        <div className="sources-list">

                                            {message.sources.map(
                                                (
                                                    source,
                                                    index
                                                ) => (

                                                    <div
                                                        key={index}
                                                        className="source-item"
                                                    >
                                                        <div className="source-header">

                                                            <FileCode
                                                                size={13}
                                                            />

                                                            <span className="source-path">
                                                                {source.file_path}
                                                            </span>

                                                            {source.name && (
                                                                <span className="source-tag name">
                                                                    {source.name}
                                                                </span>
                                                            )}

                                                            <span className="source-tag">
                                                                {source.node_type}
                                                            </span>

                                                            {source.language && (
                                                                <span className="source-tag language">
                                                                    {source.language}
                                                                </span>
                                                            )}

                                                            {source.start_line != null && (
                                                                <span className="source-lines">
                                                                    L{source.start_line}
                                                                    {source.end_line != null &&
                                                                        source.end_line !== source.start_line &&
                                                                        `–${source.end_line}`
                                                                    }
                                                                </span>
                                                            )}

                                                        </div>

                                                        <pre className="source-code">
                                                            <code>
                                                                {source.code}
                                                            </code>
                                                        </pre>
                                                    </div>
                                                )
                                            )}

                                        </div>

                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                ))}


                {sending && (

                    <div className="chat-message assistant">

                        <div className="message-avatar">
                            <Bot size={18} />
                        </div>

                        <div className="message-body">
                            <div className="typing-indicator">
                                <Loader2
                                    size={16}
                                    className="spinning"
                                />
                                CodeMentor is analyzing the codebase...
                            </div>
                        </div>

                    </div>
                )}


                <div ref={messagesEndRef} />

            </div>


            <div className="chat-input-area">

                {messages.length > 0 && (
                    <button
                        className="clear-chat-button"
                        onClick={handleClearChat}
                        title="Clear conversation"
                    >
                        <Trash2 size={14} />
                        Clear
                    </button>
                )}

                <div className="chat-input-wrapper">

                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={`Ask about ${repository.name}...`}
                        rows={1}
                        disabled={sending}
                    />

                    <button
                        className="send-button"
                        onClick={handleSend}
                        disabled={
                            !input.trim() ||
                            sending
                        }
                    >
                        <Send size={18} />
                    </button>

                </div>

                <span className="chat-hint">
                    Press Enter to send, Shift+Enter for new line
                </span>

            </div>

        </div>
    );
}
