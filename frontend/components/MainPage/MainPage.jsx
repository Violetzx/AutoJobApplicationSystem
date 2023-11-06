"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import styles from "./MainPage.module.scss"; // Make sure the path is correct
import AdminViewForScraperInfo from "@/components/AdminViewForScraperInfo/AdminViewForScraperInfo";

const MainPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true); // Disable button and show loading

    // Send POST request to your Flask server
    try {
      const response = await fetch("http://127.0.0.1:5000/start_scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // const responseData = await response.json();
      //console.log(responseData);

      // Handle response data here...
    } catch (error) {
      console.error("Error:", error);
      // Handle errors here...
    } finally {
      setIsLoading(false); // Enable button and hide loading
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
    backgroundColor: isLoading ? "#ccc" : "#007bff", // Disabled color when loading
    cursor: isLoading ? "not-allowed" : "pointer",
    // Add other styling as needed
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
              {isLoading ? "Loading..." : "Search"}
            </button>
          </div>
        </form>
      </div>

      <div>
        <AdminViewForScraperInfo isNewSearchLoaded={isLoading}/>
      </div>

      <div>
        
      </div>
    </div>
  );
};

export default MainPage;
