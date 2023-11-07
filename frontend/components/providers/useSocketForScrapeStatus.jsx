"use client";

// SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://127.0.0.1:5000';


const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isScraping, setIsScraping] = useState(false); // Changed isLoading to isScraping


  useEffect(() => {
    // Establish your socket connection here
    const socketInstance = io(SOCKET_SERVER_URL);
    setSocket(socketInstance);

    // Define other event handlers
    socketInstance.on('scrape_complete', (data) => {
        if (data.status === 'complete') {
          console.log('Scraping has completed!');
          setIsScraping(false);
        }
      });

    // Clean up the effect
    return () => {
      socketInstance.off('scrape_complete');
      socketInstance.close();
    };
  }, []);

  // Render the SocketContext.Provider with the socket instance
  return (
    <SocketContext.Provider value={{socket,isScraping, setIsScraping}}>
      {children}
    </SocketContext.Provider>
  );
};

