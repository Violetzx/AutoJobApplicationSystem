"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export const FileDetailView = () => {
  const searchParams = useSearchParams();
  // Perform any logic you need here, like fetching more details
  // For demonstration purposes, we'll just show the file name
  const file = searchParams.get("file");
  const date = searchParams.get("date");

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
    <div>
      <h1>Job Listings</h1>
      <ul>
        {jobs.map((job, index) => (
          <li key={index}>
            <h2>{job.title}</h2>
            <p>Company: {job.company}</p>
            <p>Location: {job.location}</p>
            <p>Type: {job.type}</p>
            {job.description && <p>Description: {job.description}</p>}
            {job.links && job.links.map((link, linkIndex) => (
              <p key={linkIndex}>Apply here: <a href={link} target="_blank" rel="noopener noreferrer">Link</a></p>
            ))}
            {/* You can add more details from the job object as needed */}
          </li>
        ))}
      </ul>
    </div>
  );
};
