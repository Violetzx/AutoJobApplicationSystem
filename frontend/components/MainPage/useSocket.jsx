"use client";
// useSocket.js
import { useEffect } from 'react';
import io from 'socket.io-client';



const SOCKET_SERVER_URL = 'http://127.0.0.1:5000';

export const useSocket = (setIsLoading) => {
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);

    socket.on('scrape_complete', (data) => {
      if (data.status === 'complete') {
        console.log('Scraping has completed!');
        setIsLoading(false);
      }
    });

    return () => {
      socket.off('scrape_complete');
      socket.close();
    };
  }, [setIsLoading]);
};

