"use client";

import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import styles from "./MainPage.module.scss"; // Make sure the path is correct
import AdminViewForScraperInfo from "@/components/AdminViewForScraperInfo/AdminViewForScraperInfo";


import { useSocket } from '@/components/providers/useSocketForScrapeStatus';


const MainPage = () => {
  // const [isLoading, setIsLoading] = useState(false);
  const {isScraping, setIsScraping} = useSocket()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const abortControllerRef = useRef(null);

  const onSubmit = async (data) => {
    console.log('Start Loading');

    setIsScraping(true); // Disable button and show loading

    // Create a new AbortController instance
    const abortController = new AbortController();
    const { signal } = abortController;

    // Save the abortController in a ref or state if you need to access it outside of this function
    abortControllerRef.current = abortController;

    // Send POST request to your Flask server
    try {
      const response = await fetch("http://127.0.0.1:5000/start_scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // Pass the signal to the fetch request
        signal: signal, // Pass the signal to the fetch request
      });

      await response.json(); // You may want to check response status or data

      // console.log('43 Stop Loading');
      // setIsLoading(false); // Disable loading state when scraping completes

      // Handle response data here...
    } catch (error) {
      console.error("Error:", error);
      console.log('Stop Loading');
      setIsScraping(false); // Ensure loading state is disabled on error
    } 
  };

  const handleCancelClick = async () => {
    // Abort the fetch request if the controller exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // This will trigger the AbortError in the fetch promise
      abortControllerRef.current = null; // Reset the controller ref
    }

    // Use the fetch API to send a POST request to the stop_scrape endpoint
    try {
      const response = await fetch("http://127.0.0.1:5000/stop_scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      

      await response.json(); // You may want to check response status or data
      console.log('Stop Loading');
      setTimeout(() => {
        setIsScraping(false); // This will run after a 2-second delay
      }, 1000);  // Disable loading state when cancellation is confirmed
    } catch (error) {
      console.error("Error stopping the scraper: ", error);
    }
  };


  

  // Custom validator to check for empty or space-only values
  const notEmptyOrSpace = (value) => {
    // Trim the value to remove whitespace from both ends of a string
    if (value.trim().length === 0) {
      return "This field cannot be empty.";
    }
    return true; // If validation is successful, return true
  };

  // Styles
  const buttonStyle = {
    backgroundColor: isScraping ? "#ccc" : "#007bff", // Disabled color when loading
    cursor: isScraping ? "not-allowed" : "pointer",
    // Add other styling as needed
  };
  const buttonStyleForStop = {
    cursor: isScraping ? 'pointer' : 'not-allowed', // Change cursor based on isLoading
                opacity: isScraping ? 1 : 0.5, // Dim the button when not clickable
                backgroundColor: isScraping ? '#dc3545' : '#ccc', // Change background color
                color: '#fff', // White text color
                border: 'none',
                borderRadius: '4px',
                
                marginLeft: '10px'
                // Add other styles as needed
  };

  return (
    <div>
      <div className={styles.MainPageContainer}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Job Title:
            </label>
            <input
              className={`${styles.input} ${errors.title ? styles.error : ""}`}
              {...register("title", { validate: notEmptyOrSpace })}
              type="text"
              id="title"
            />
            {errors.title && (
              <p className={styles.errorMessage}>{errors.title.message}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location" className={styles.label}>
              Job Location:
            </label>
            <input
              className={`${styles.input} ${
                errors.location ? styles.error : ""
              }`}
              {...register("location", { validate: notEmptyOrSpace })}
              type="text"
              id="location"
            />
            {errors.location && (
              <p className={styles.errorMessage}>{errors.location.message}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <button
              type="submit"
              className={styles.submitButton}
              style={buttonStyle}
            >
              {isScraping ? "Loading..." : "Search"}
            </button>

            <button
              type="button"
              onClick={handleCancelClick}
              disabled={!isScraping}
              className={styles.submitButton}
              style={buttonStyleForStop}
            >
              Stop
            </button>
          </div>
        </form>
      </div>

      <div>
        <AdminViewForScraperInfo isNewSearchLoaded={isScraping} />
      </div>

      <div></div>
    </div>
  );
};

export default MainPage;
