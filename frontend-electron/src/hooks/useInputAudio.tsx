import { useState, useEffect } from "react";

export default function useInputAudio() {
    const [data, setData] = useState<MediaStream | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            setLoading(false);
            setData(stream);
        }, error => {
            setLoading(false);
            setError(error.message);
        })
    }, []);
    return { data, loading, error };
}