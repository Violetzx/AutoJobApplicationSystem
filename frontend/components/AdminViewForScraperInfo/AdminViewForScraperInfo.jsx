"use client";

import React, { useState, useEffect } from "react";

import handleFileDelete from "@/components/AdminViewForScraperInfo/userDeleteFile"; // Update the path as necessary
import styles from "./AdminViewForScraperInfo.module.scss"; // Make sure the path is correct


import Link from "next/link";




const AdminViewForScraperInfo = ({ isNewSearchLoaded }) => {
  //const [folders, setFolders] = useState([]);
  const [dataFolders, setDataFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const handleFileClick = (fileName) => {
    // const searchParams = useSearchParams()
    console.log(fileName)
  };
  


  useEffect(() => {
    if (!isNewSearchLoaded) {
      fetchDataFolders();
    }
  }, [isNewSearchLoaded]); // Runs every time isLoading changes

  useEffect(() => {
    
    fetchDataFolders();
  }, []);
  const fetchDataFolders = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/all-data");
      const data = await response.json();
      //setFolders(data);
      setDataFolders(data);
    } catch (error) {
      console.error("There was an error fetching the folder data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1>Scraper Data</h1>

      {dataFolders.map(
        (dataFolder, index) =>
          dataFolder.files.length > 0 && (
            <div className={styles.dateFolder} key={index}>
              <h2>{dataFolder.date}</h2>
              <ul>
                {dataFolder.files.map((file, fileIndex) => (
                  <li key={fileIndex}>
                    <div className={styles.fileItem}>
                    <Link
                          className={styles.fileLink}
                          href={{pathname: '/about',
                          query: {
                            file: file,
                            date: dataFolder.date,
                          }
                        }}
                          
                          role="button"
                          tabIndex={0} // for accessibility purposes
                        >
                          {file}
                        </Link>

                      <button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          handleFileDelete(
                            dataFolder.date,
                            file,
                            dataFolders,
                            setDataFolders
                          )
                        }
                        className={`delete-button ${styles.deleteButton}`} // Update this line
                        aria-label={`Delete ${file}`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          height="24"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          width="24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
      )}


    </div>
  );
};

export default AdminViewForScraperInfo;
