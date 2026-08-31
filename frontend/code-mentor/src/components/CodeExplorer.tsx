import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    FolderOpen,
    Folder,
    FileCode,
    File as FileIcon,
    ChevronRight,
    ChevronDown,
    Loader2,
    AlertCircle,
    Copy,
    Check
} from "lucide-react";

import type {
    Repository,
    FileTreeNode,
    FileContentResponse
} from "../types";

import {
    getFileTree,
    getFileContent
} from "../services/api";


interface Props {
    repository: Repository;
}


export default function CodeExplorer({
    repository
}: Props) {

    const [tree, setTree] =
        useState<FileTreeNode[]>([]);

    const [treeLoading, setTreeLoading] =
        useState(true);

    const [treeError, setTreeError] =
        useState<string | null>(null);

    const [selectedFile, setSelectedFile] =
        useState<string | null>(null);

    const [fileData, setFileData] =
        useState<FileContentResponse | null>(null);

    const [fileLoading, setFileLoading] =
        useState(false);

    const [fileError, setFileError] =
        useState<string | null>(null);

    const [copied, setCopied] =
        useState(false);

    const [expandedDirs, setExpandedDirs] =
        useState<Set<string>>(new Set());


    const loadTree = useCallback(async () => {

        setTreeLoading(true);
        setTreeError(null);

        try {

            const response =
                await getFileTree(repository.id);

            setTree(response.tree);

        } catch (err) {

            console.error("Failed to load file tree:", err);

            setTreeError(
                "Failed to load file tree."
            );

        } finally {

            setTreeLoading(false);

        }

    }, [repository.id]);


    useEffect(() => {

        loadTree();
        setSelectedFile(null);
        setFileData(null);
        setExpandedDirs(new Set());

    }, [loadTree]);


    const handleSelectFile = async (
        filePath: string
    ) => {

        if (selectedFile === filePath) {
            return;
        }

        setSelectedFile(filePath);
        setFileLoading(true);
        setFileError(null);
        setFileData(null);

        try {

            const data =
                await getFileContent(
                    repository.id,
                    filePath
                );

            setFileData(data);

        } catch (err) {

            console.error("Failed to load file:", err);

            const message =
                (err as { response?: { data?: { detail?: string } } })
                    ?.response?.data?.detail
                    || "Failed to load file.";

            setFileError(message);

        } finally {

            setFileLoading(false);

        }
    };


    const toggleDirectory = (dirPath: string) => {

        setExpandedDirs((prev) => {

            const next = new Set(prev);

            if (next.has(dirPath)) {
                next.delete(dirPath);
            } else {
                next.add(dirPath);
            }

            return next;
        });
    };


    const handleCopy = async () => {

        if (!fileData?.content) return;

        try {

            await navigator.clipboard.writeText(
                fileData.content
            );

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);

        } catch {
            console.error("Failed to copy");
        }
    };


    const formatSize = (bytes: number) => {

        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };


    const getFileIcon = (name: string) => {

        const ext = name.split(".").pop()?.toLowerCase();

        const codeExts = new Set([
            "py", "js", "jsx", "ts", "tsx", "java",
            "c", "cpp", "h", "hpp", "cs", "go",
            "rs", "rb", "php", "kt", "swift", "dart",
            "html", "css", "scss", "sql", "sh"
        ]);

        if (ext && codeExts.has(ext)) {
            return <FileCode size={15} />;
        }

        return <FileIcon size={15} />;
    };


    const renderTreeNode = (
        node: FileTreeNode,
        depth: number = 0
    ) => {

        const isExpanded =
            expandedDirs.has(node.path);

        if (node.type === "directory") {

            return (
                <div key={node.path}>

                    <button
                        className="tree-node directory"
                        style={{
                            paddingLeft: `${12 + depth * 16}px`
                        }}
                        onClick={() =>
                            toggleDirectory(node.path)
                        }
                    >
                        <span className="tree-chevron">
                            {isExpanded
                                ? <ChevronDown size={14} />
                                : <ChevronRight size={14} />
                            }
                        </span>

                        <span className="tree-icon folder">
                            {isExpanded
                                ? <FolderOpen size={15} />
                                : <Folder size={15} />
                            }
                        </span>

                        <span className="tree-name">
                            {node.name}
                        </span>
                    </button>

                    {isExpanded && node.children && (

                        <div className="tree-children">
                            {node.children.map(
                                (child) =>
                                    renderTreeNode(
                                        child,
                                        depth + 1
                                    )
                            )}
                        </div>

                    )}

                </div>
            );
        }

        return (
            <button
                key={node.path}
                className={`tree-node file ${
                    selectedFile === node.path
                        ? "selected"
                        : ""
                }`}
                style={{
                    paddingLeft: `${28 + depth * 16}px`
                }}
                onClick={() =>
                    handleSelectFile(node.path)
                }
            >
                <span className="tree-icon file">
                    {getFileIcon(node.name)}
                </span>

                <span className="tree-name">
                    {node.name}
                </span>
            </button>
        );
    };


    const renderLineNumbers = (content: string) => {

        const lines = content.split("\n");

        return lines.map(
            (_, index) => (
                <span
                    key={index}
                    className="line-number"
                >
                    {index + 1}
                </span>
            )
        );
    };


    return (
        <div className="code-explorer">

            <div className="explorer-tree">

                <div className="explorer-tree-header">
                    <span>Files</span>
                    <span className="tree-count">
                        {repository.total_files} files
                    </span>
                </div>

                <div className="explorer-tree-content">

                    {treeLoading && (

                        <div className="tree-loading">
                            <Loader2
                                size={20}
                                className="spinning"
                            />
                            <span>Loading...</span>
                        </div>

                    )}

                    {treeError && (

                        <div className="tree-error">
                            <AlertCircle size={16} />
                            <span>{treeError}</span>
                        </div>

                    )}

                    {!treeLoading &&
                        !treeError &&
                        tree.length === 0 && (

                        <div className="tree-empty">
                            No files found
                        </div>

                    )}

                    {!treeLoading &&
                        !treeError &&
                        tree.map((node) =>
                            renderTreeNode(node)
                        )
                    }

                </div>

            </div>


            <div className="explorer-viewer">

                {!selectedFile && !fileLoading && (

                    <div className="viewer-empty">

                        <FileCode size={40} />

                        <h3>
                            Select a file to view
                        </h3>

                        <p>
                            Browse the file tree and click
                            on a file to view its contents.
                        </p>

                    </div>

                )}


                {fileLoading && (

                    <div className="viewer-loading">
                        <Loader2
                            size={24}
                            className="spinning"
                        />
                        <span>Loading file...</span>
                    </div>

                )}


                {fileError && (

                    <div className="viewer-error">
                        <AlertCircle size={20} />
                        <span>{fileError}</span>
                    </div>

                )}


                {fileData && !fileLoading && !fileError && (

                    <>
                        <div className="viewer-header">

                            <div className="viewer-path">
                                {fileData.file_path.split("/").map(
                                    (part, index, arr) => (
                                        <span key={index}>
                                            {index > 0 && (
                                                <span className="path-separator">
                                                    /
                                                </span>
                                            )}
                                            <span className={
                                                index === arr.length - 1
                                                    ? "path-file"
                                                    : "path-dir"
                                            }>
                                                {part}
                                            </span>
                                        </span>
                                    )
                                )}
                            </div>

                            <div className="viewer-meta">

                                <span className="viewer-lang">
                                    {fileData.language}
                                </span>

                                <span className="viewer-size">
                                    {formatSize(fileData.size)}
                                </span>

                                <button
                                    className="viewer-copy"
                                    onClick={handleCopy}
                                    title="Copy file contents"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={14} />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            Copy
                                        </>
                                    )}
                                </button>

                            </div>

                        </div>

                        <div className="viewer-code">

                            <div className="line-numbers">
                                {renderLineNumbers(
                                    fileData.content
                                )}
                            </div>

                            <pre className="code-content">
                                <code>
                                    {fileData.content}
                                </code>
                            </pre>

                        </div>

                    </>

                )}

            </div>

        </div>
    );
}
