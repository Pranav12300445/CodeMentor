import {
    useEffect,
    useState
} from "react";

import { Wifi, WifiOff } from "lucide-react";

import { healthCheck } from "../services/api";


export default function ConnectionStatus() {

    const [connected, setConnected] =
        useState<boolean | null>(null);

    useEffect(() => {

        let intervalId: ReturnType<typeof setInterval>;

        const check = async () => {

            const healthy =
                await healthCheck();

            setConnected(healthy);
        };

        check();

        intervalId = setInterval(
            check,
            30000
        );

        return () => {
            clearInterval(intervalId);
        };

    }, []);


    return (
        <div className="connection-status">

            <div className={`connection-dot ${
                connected === null
                    ? "checking"
                    : connected
                        ? "connected"
                        : "disconnected"
            }`} />

            {connected === null ? (
                <WifiOff size={14} />
            ) : connected ? (
                <Wifi size={14} />
            ) : (
                <WifiOff size={14} />
            )}

            <span>
                {connected === null
                    ? "Checking..."
                    : connected
                        ? "Backend connected"
                        : "Backend offline"}
            </span>

        </div>
    );
}
