const handleFileDelete = async (folderDate, fileName, dataFolders, setDataFolders) => {
    try {
      // Call Flask API to delete the file
      const response = await fetch(`http://127.0.0.1:5000/delete-data/${folderDate}/${fileName}`, {
        method: 'DELETE',
        // Add any needed headers or other request properties
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete the file');
      }
  
      // If successful, filter out the deleted file from the dataFolders state
      const newDataFolders = dataFolders.map(folder => {
        if (folder.date === folderDate) {
          return {
            ...folder,
            files: folder.files.filter(file => file !== fileName)
          };
        }
        return folder;
      });
  
      setDataFolders(newDataFolders);
    } catch (error) {
      console.error("There was an error deleting the file:", error);
      // Optionally, display a message to the user
    }
  };
  
  export default handleFileDelete;
  