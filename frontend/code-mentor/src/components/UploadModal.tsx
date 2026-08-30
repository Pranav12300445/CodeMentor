import {
    useRef,
    useState
} from "react";

import {
    X,
    Upload,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";

interface Props {
    open: boolean;

    onClose: () => void;

    onUpload: (
        file: File
    ) => Promise<void>;
}


type UploadState =
    | "idle"
    | "uploading"
    | "processing"
    | "success"
    | "error";


export default function UploadModal({
    open,
    onClose,
    onUpload
}: Props) {

    const fileInputRef =
        useRef<HTMLInputElement>(null);

    const [file, setFile] =
        useState<File | null>(null);

    const [uploadState, setUploadState] =
        useState<UploadState>("idle");

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    if (!open) {
        return null;
    }

    const isBusy =
        uploadState === "uploading" ||
        uploadState === "processing";

    const handleClose = () => {

        if (isBusy) {
            return;
        }

        setFile(null);
        setUploadState("idle");
        setErrorMessage(null);

        onClose();
    };

    const handleUpload = async () => {

        if (!file || isBusy) {
            return;
        }

        setErrorMessage(null);
        setUploadState("uploading");

        try {

            // Short delay so user sees "Uploading" state
            // before it transitions to processing
            await new Promise(
                (resolve) => setTimeout(resolve, 300)
            );

            setUploadState("processing");

            await onUpload(file);

            setUploadState("success");

            // Auto-close on success after brief delay
            setTimeout(() => {

                setFile(null);
                setUploadState("idle");
                setErrorMessage(null);

                onClose();

            }, 1200);

        } catch (error) {

            const message =
                error instanceof Error
                    ? error.message
                    : "Upload failed. Please try again.";

            setErrorMessage(message);
            setUploadState("error");
        }
    };

    const handleDrop = (
        event: React.DragEvent
    ) => {

        event.preventDefault();

        if (isBusy) {
            return;
        }

        const dropped =
            event.dataTransfer.files[0];

        if (
            dropped &&
            dropped.name.toLowerCase().endsWith(".zip")
        ) {
            setFile(dropped);
            setErrorMessage(null);
        } else {
            setErrorMessage(
                "Only .zip files are supported."
            );
        }
    };

    const handleDragOver = (
        event: React.DragEvent
    ) => {
        event.preventDefault();
    };


    const renderStatusMessage = () => {

        switch (uploadState) {

            case "uploading":
                return (
                    <div className="upload-status">
                        <Loader2 size={20} className="spinning" />
                        <span>Uploading repository...</span>
                    </div>
                );

            case "processing":
                return (
                    <div className="upload-status">
                        <Loader2 size={20} className="spinning" />
                        <span>
                            Processing repository...
                            This may take a moment.
                        </span>
                    </div>
                );

            case "success":
                return (
                    <div className="upload-status success">
                        <CheckCircle2 size={20} />
                        <span>Repository ready!</span>
                    </div>
                );

            case "error":
                return (
                    <div className="upload-status error">
                        <AlertCircle size={20} />
                        <span>
                            {errorMessage ||
                                "Upload failed."}
                        </span>
                    </div>
                );

            default:
                return null;
        }
    };


    return (
        <div
            className="modal-overlay"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose();
                }
            }}
        >

            <div className="upload-modal">

                <div className="modal-header">

                    <h2>
                        Upload Repository
                    </h2>

                    <button
                        onClick={handleClose}
                        className="icon-button"
                        disabled={isBusy}
                    >
                        <X size={20} />
                    </button>

                </div>


                <div
                    className={`upload-area ${
                        isBusy ? "disabled" : ""
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >

                    <Upload size={36} />

                    <p>
                        {file
                            ? "Ready to upload"
                            : "Drag and drop or select a repository ZIP"
                        }
                    </p>

                    <span>
                        Only .zip files are supported
                    </span>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip"
                        hidden
                        onChange={(event) => {

                            const selected =
                                event.target.files?.[0];

                            if (selected) {
                                setFile(selected);
                                setErrorMessage(null);
                                setUploadState("idle");
                            }

                        }}
                    />

                    <button
                        className="secondary-button"
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
                        disabled={isBusy}
                    >
                        Choose ZIP
                    </button>

                    {file && (
                        <div className="selected-file">
                            📦 {file.name}
                            <span className="file-size">
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                        </div>
                    )}

                </div>


                {renderStatusMessage()}


                <div className="modal-actions">

                    <button
                        className="secondary-button"
                        onClick={handleClose}
                        disabled={isBusy}
                    >
                        Cancel
                    </button>

                    <button
                        className="primary-button"
                        onClick={handleUpload}
                        disabled={
                            !file ||
                            isBusy ||
                            uploadState === "success"
                        }
                    >
                        {isBusy
                            ? "Processing..."
                            : "Upload Repository"
                        }
                    </button>

                </div>

            </div>

        </div>
    );
}