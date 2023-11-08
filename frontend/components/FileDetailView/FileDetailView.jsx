"use client";

import React, { useState, useEffect } from "react";
//import { useSearchParams } from "next/navigation";
import styles from "./FileDetailView.module.scss"; // This is the compiled CSS file from SCSS

import { useAtom } from "jotai";
import { selectedFileNameAtom, selectedDateAtom } from "@/lib/store.js";
import { nanoid } from 'nanoid'; // Import the nanoid library


export const FileDetailView = () => {
  // const searchParams = useSearchParams();
  // // Perform any logic you need here, like fetching more details
  // // For demonstration purposes, we'll just show the file name
  // const file = searchParams.get("file");
  // const date = searchParams.get("date");
  const [file] = useAtom(selectedFileNameAtom);
  const [date] = useAtom(selectedDateAtom);
  const fileDisplay = file ? file.replace(".json", "").replace(/_/g, " ") : "Job list";
  const [jobs, setJobs] = useState([]); // Initializing state to hold the jobs data

  // Call `fetchFileContent` from within `useEffect`
  useEffect(() => {
    if (file && date) {
      fetchFileContent(file, date);
    }
  }, [file, date]);

  const fetchFileContent = async () => {
    if (file && date) {
      try {
        // Construct the URL with the date and filename
        const url = `http://127.0.0.1:5000/files/${date}/${file}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Parse it as JSON
        setJobs(data.jobs);
        // Do something with the JSON content
      } catch (err) {
        console.error("Fetching file content failed:", err);
        // Handle errors here
      }
    }
  };

  return (
    <div className={styles.fileDetailView}>
     <h1 className={styles.title}>{fileDisplay}</h1>
      <ul className={styles.jobList}>
        
        {jobs.map((job, index) => (
          <div key={nanoid()}>
            <li  className={styles.jobItem}>
              <h2 className={styles.jobTitle}>{job.title}</h2>
              <p className={styles.jobInfo}>Company: {job.company}</p>
              <p className={styles.jobInfo}>Location: {job.location}</p>
              <p className={styles.jobInfo}>Type: {job.type}</p>
              {/* If job.description exists, render it */}
              {/* {job.description && <p className={styles.jobInfo}>Description: {job.description}</p>} */}
              {job.links &&
                job.links.map((link, linkIndex) => (
                  <p key={nanoid()} className={styles.jobInfo}>
                    Apply here:{" "}
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.jobLink}
                    >
                      Link
                    </a>
                  </p>
                ))}
              {/* Additional job details can be added here */}
            </li>
          </div>
        ))}
      </ul>
    </div>
  );
};
