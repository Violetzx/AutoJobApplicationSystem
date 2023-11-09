import os

def clear_directory(directory):
    for file in os.listdir(directory):
        file_path = os.path.join(directory, file)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')


# def get_cover_letter_filename(directory):
#     try:
#         files = os.listdir(directory)
#         if not files:
#             return None  # No file found
#         for file in files:
#             # Assuming there's only one file in the directory
#             return file
#     except Exception as e:
#         print(f'Failed to get file name. Reason: {e}')
#         return None
    
def get_cover_letter_filename(directory):
    try:
        files = os.listdir(directory)
        if not files:
            return None  # No file found
        # Sort files by modification time in ascending order
        earliest_file = min(files, key=lambda x: os.path.getmtime(os.path.join(directory, x)))
        return earliest_file
    except Exception as e:
        print(f'Failed to get file name. Reason: {e}')
        return None