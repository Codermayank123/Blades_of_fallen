import { useEffect, useRef, useCallback, useState } from 'react';

export function useWebSocket(url, handlers) {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const reconnectTimeoutRef = useRef(null);
    const handlersRef = useRef(handlers);

    // Keep handlers ref updated
    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    const connect = useCallback(() => {
        try {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setConnected(true);
                handlersRef.current.onConnect?.();
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setConnected(false);
                handlersRef.current.onDisconnect?.();

                // Reconnect after 2 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 2000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handlersRef.current.onMessage?.(data);
                } catch (e) {
                    console.error('Failed to parse message:', e);
                }
            };

            socketRef.current = ws;
        } catch (error) {
            console.error('Failed to connect:', error);
        }
    }, [url]);

    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [connect]);

    const send = useCallback((data) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        }
    }, []);

    return { send, connected };
}
