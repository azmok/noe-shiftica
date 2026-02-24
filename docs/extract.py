import zipfile
import xml.etree.ElementTree as ET
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_docx(file_path):
    try:
        z = zipfile.ZipFile(file_path)
        xml_content = z.read('word/document.xml')
        root = ET.fromstring(xml_content)
        texts = []
        for p in root.findall('.//*{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            text = ''.join(node.text for node in p.iter() if node.text)
            if text.strip():
                texts.append(text)
        print('\n'.join(texts))
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

if __name__ == '__main__':
    extract_docx(sys.argv[1])
