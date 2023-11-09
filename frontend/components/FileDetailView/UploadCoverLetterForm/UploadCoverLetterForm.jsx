import React, { useState, useEffect } from "react";
import styles from "./UploadCoverLetterForm.module.scss";


import { useAtom } from 'jotai';
import { isCoverLetterUploadedAtom } from '@/lib/store';

const UploadCoverLetterForm = () => {
  const [coverLetter, setCoverLetter] = useState(null);

  const [, setIsCoverLetterUploaded] = useAtom(isCoverLetterUploadedAtom);

  const handleFileChange = (event) => {
    setCoverLetter(event.target.files[0]);
  };

  useEffect(() => {
    if (coverLetter) {
      handleCoverLetterUpload();
    }
  }, [coverLetter]);
  const handleCoverLetterUpload = async () => {
    const formData = new FormData();
    formData.append("coverLetter", coverLetter); // The original file name is included here
    try {
      const response = await fetch("http://127.0.0.1:5000/upload_cover_letter", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setIsCoverLetterUploaded(true);
        const responseBody = await response.json();
        console.log(responseBody);
      } else {
        const error = await response.text();
        console.log(error);
      }
    } catch (error) {
        console.log(error);
    }
  };

  return (
    <>
      <div className={styles.uploadForm}>
        <input
          id="coverLetterInput"
          type="file"
          onChange={handleFileChange}
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className={styles.uploadForm__input}
          style={{ display: "none" }} // Hide the default input
        />
        <div style={{display:'flex', flexDirection:'row', alignItems:'center'}}>
        <label htmlFor="coverLetterInput" className={styles.uploadForm__button}>
          Upload Cover Letter </label>
        <span> for auto fill</span>
        </div>
      </div>
      
    </>
  );
};

export default UploadCoverLetterForm;
