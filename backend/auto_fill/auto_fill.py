from docx import Document
from docx.shared import Pt

def replace_placeholder_run(run, key, value, font_name='Arial', font_size_pt=12):
    if key in run.text:
        # Preserve original formatting
        run.text = run.text.replace(key, value)
        run.font.name = font_name
        run.font.size = Pt(font_size_pt)

def replace_placeholders(doc_path, replacements):
    doc = Document(doc_path)
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            for key, value in replacements.items():
                replace_placeholder_run(run, key, value)
    return doc

# Dictionary of placeholders and their replacements
replacements = {
    '[date]': 'November 8, 2023',
    '[company]': 'Carvel Inc.',
    '[city]': 'Toronto',
    '[title]': 'Software Developer',
    '[via]': 'Indeed'
}

# Replace placeholders in the document
doc_path = './cover_letter/cover_letter.docx'
modified_doc = replace_placeholders(doc_path, replacements)

# Save the modified document
modified_doc_path = './cover_letter/modified_cover_letter.docx'
modified_doc.save(modified_doc_path)
