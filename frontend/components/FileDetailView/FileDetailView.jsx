"use client";

import React, { useState, useEffect } from "react";
//import { useSearchParams } from "next/navigation";
import styles from "./FileDetailView.module.scss"; // This is the compiled CSS file from SCSS
import UploadCoverLetterForm from "./UploadCoverLetterForm/UploadCoverLetterForm";

import { useAtom } from "jotai";
import {
  selectedFileNameAtom,
  selectedDateAtom,
  jobClickedAtom,
  isCoverLetterUploadedAtom,
} from "@/lib/store";
import { nanoid } from "nanoid"; // Import the nanoid library

export const FileDetailView = () => {
  const [dataFolders, setDataFolders] = useState([]);
  const [selectedFileName, setSelectedFileName] = useAtom(selectedFileNameAtom);
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);
  const [jobClicked, setJobClicked] = useAtom(jobClickedAtom);
  const [isCoverLetterUploaded, setIsCoverLetterUploaded] = useAtom(
    isCoverLetterUploadedAtom
  );

  const [coverLetterName, setCoverLetterName] = useState("");

  const [file] = useAtom(selectedFileNameAtom);
  const [date] = useAtom(selectedDateAtom);
  const fileDisplay = file ? file.replace(".json", "").replace(/_/g, " ") : "";
  const [jobs, setJobs] = useState([]); // Initializing state to hold the jobs data

  useEffect(() => {
    fetchCoverLetterName();
    setIsCoverLetterUploaded(false);
  }, [isCoverLetterUploaded]);
  useEffect(() => {
    fetchDataFolders();
    fetchCoverLetterName();
    //fetchFileContent(file, date);
  }, []);
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

  const fetchDataFolders = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/all-data");
      const data = await response.json();
      setDataFolders(data);

      if (!jobClicked && data.length > 0) {
        // Find the first dataFolder with files
        const latestDataFolder = data.find((df) => df.files.length > 0);

        //const latestDataFolder = data[0];
        if (latestDataFolder.files.length > 0) {
          const latestFile = latestDataFolder.files[0]; // Get the latest file
          setSelectedFileName(latestFile); // Set the latest file name in the atom
          setSelectedDate(latestDataFolder.date); // Set the latest date in the atom
        }
      }
    } catch (error) {
      console.error("There was an error fetching the folder data:", error);
    }
  };

  const fetchCoverLetterName = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/get-cover-letter-name"
      );
      const data = await response.json();
      if (data.filename) {
        setCoverLetterName(data.filename);
      } else {
        // Handle no file found or other errors
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error fetching the cover letter name:", error);
    }
  };

  const handleEditCoverLetterClick = async (job) => {
    const currentDate = new Date();
    const formattedDate = `${
      currentDate.getMonth() + 1
    }/${currentDate.getDate()}/${currentDate.getFullYear()}`;
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/modify-cover-letter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company: job.company,
            city: job.location, // Assuming job.location contains the city
            title: job.title,
            via: job.via, // Example source
            date: formattedDate, // Example date
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        console.log(result.message);
        // Handle success, perhaps update state to reflect the modified cover letter
      } else {
        console.error("Error modifying cover letter:", result);
      }
    } catch (error) {
      console.error("Error modifying cover letter:", error);
    }
  };

  function getTimeValue(timeString) {
    const daysMatch = timeString.match(/(\d+)\s+days? ago/);
    const hoursMatch = timeString.match(/(\d+)\s+hours? ago/);

    if (daysMatch) {
      return parseInt(daysMatch[1], 10) * 24; // Convert days to hours
    } else if (hoursMatch) {
      return parseInt(hoursMatch[1], 10);
    } else if (timeString.toLowerCase() === "none") {
      return Infinity;
    } else {
      return null; // or some default value
    }
  }

  const isWithin15DaysOrNone = (timeString) => {
    if (timeString.toLowerCase() === "none") {
      return true;
    }
    const timeValue = getTimeValue(timeString);
    return timeValue !== null && timeValue <= 15 * 24; // Check within 15 days in hours
  };
  // Add this sorting function before the return statement
  const sortJobsByUploadTime = (jobA, jobB) => {
    const timeValueA = getTimeValue(jobA.time);
    const timeValueB = getTimeValue(jobB.time);
    return timeValueA - timeValueB;
  };

  return (
    <div className={styles.fileDetailView}>
      <h1 className={styles.title}>{fileDisplay}</h1>

      {/* Include the upload form component */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          alignContent: "space-around",
        }}
      >
        <span>{coverLetterName}</span>
        <UploadCoverLetterForm />
      </div>
      {/* Rest of your component */}

      <ul className={styles.jobList}>
        {jobs
          .sort(sortJobsByUploadTime)
          .filter((job) => isWithin15DaysOrNone(job.time))
          .map((job, index) => (
            <div key={nanoid()}>
              <li className={styles.jobItem}>
                <div className={styles.jobAndBtn}>
                  <div>
                    <div className={styles.jobDetails}>
                      <h2 className={styles.jobTitle}>{job.title}</h2>
                      <p className={styles.jobInfo}>Company: {job.company}</p>
                      <p className={styles.jobInfo}>Location: {job.location}</p>
                      <p className={styles.jobInfo}>Type: {job.type}</p>
                      <p className={styles.jobInfo}>Upload time: {job.time}</p>
                      {/* If job.description exists, render it */}
                      {/* {job.description && <p className={styles.jobInfo}>Description: {job.description}</p>} */}
                    </div>
                    <div className={styles.applyLinks}>
                      <span>Apply here: </span>
                      {job.links &&
                        job.links.map((link, linkIndex) => (
                          <p key={nanoid()} className={styles.jobInfo}>
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
                    </div>
                  </div>
                  {/* Additional job details can be added here */}
                  <div>
                    <button
                      className={styles.editCoverLetterButton}
                      onClick={() => {
                        /* Call your API function here */
                        handleEditCoverLetterClick(job);
                      }}
                    >
                      Autofill Cover Letter
                    </button>
                  </div>
                </div>
              </li>
            </div>
          ))}
      </ul>
    </div>
  );
};
