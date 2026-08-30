import {
    useRef,
    useState
} from "react";

import {
    X,
    Upload
} from "lucide-react";

interface Props {
    open: boolean;

    onClose: () => void;

    onUpload: (
        file: File
    ) => Promise<void>;
}

export default function UploadModal({
    open,
    onClose,
    onUpload
}: Props) {

    const fileInputRef =
        useRef<HTMLInputElement>(null);

    const [file, setFile] =
        useState<File | null>(null);

    const [uploading, setUploading] =
        useState(false);

    if (!open) {
        return null;
    }

    const handleUpload = async () => {

        if (!file) {
            return;
        }

        try {

            setUploading(true);

            await onUpload(file);

            setFile(null);

            onClose();

        } finally {

            setUploading(false);

        }
    };

    return (
        <div className="modal-overlay">

            <div className="upload-modal">

                <div className="modal-header">

                    <h2>
                        Upload Repository
                    </h2>

                    <button
                        onClick={onClose}
                        className="icon-button"
                    >
                        <X size={20} />
                    </button>

                </div>


                <div className="upload-area">

                    <Upload size={36} />

                    <p>
                        Select a repository ZIP file
                    </p>

                    <span>
                        Currently only .zip files are supported
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
                            }

                        }}
                    />

                    <button
                        className="secondary-button"
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
                    >
                        Choose ZIP
                    </button>

                    {file && (
                        <div className="selected-file">
                            {file.name}
                        </div>
                    )}

                </div>


                <div className="modal-actions">

                    <button
                        className="secondary-button"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        Cancel
                    </button>

                    <button
                        className="primary-button"
                        onClick={handleUpload}
                        disabled={
                            !file ||
                            uploading
                        }
                    >
                        {uploading
                            ? "Processing..."
                            : "Upload Repository"}
                    </button>

                </div>

            </div>

        </div>
    );
}