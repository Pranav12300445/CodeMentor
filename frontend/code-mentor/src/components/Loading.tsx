import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="loading">
            <Loader2 size={28} className="spinning" />
            <span>Loading...</span>
        </div>
    );
}