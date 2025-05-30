document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const selectFileBtn = document.getElementById('selectFileBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const uploaderSelect = document.getElementById('uploaderSelect');
  const resultContainer = document.getElementById('resultContainer');
  const resultContent = document.getElementById('resultContent');
  const copyBtn = document.getElementById('copyBtn');
  const statusDiv = document.getElementById('status');

  let selectedFile = null;

  // Load available uploaders
  loadUploaders();

  // Event listeners
  selectFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  uploadBtn.addEventListener('click', handleUpload);
  copyBtn.addEventListener('click', copyResult);

  function loadUploaders() {
    fetch('/api/list')
      .then(response => response.json())
      .then(uploaders => {
        uploaderSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select an upload service';
        uploaderSelect.appendChild(defaultOption);
        
        uploaders.forEach((uploader, index) => {
          const option = document.createElement('option');
          option.value = uploader;
          option.textContent = `${index + 1}. ${uploader}`;
          uploaderSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error loading uploaders:', error);
        statusDiv.textContent = 'Failed to load upload services. Please refresh the page.';
        statusDiv.style.color = '#e74c3c';
      });
  }

  function handleFileSelect(e) {
    if (e.target.files.length > 0) {
      selectedFile = e.target.files[0];
      updateUI();
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('highlight');
  }

  function handleDragLeave() {
    dropZone.classList.remove('highlight');
  }

  function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('highlight');
    
    if (e.dataTransfer.files.length > 0) {
      selectedFile = e.dataTransfer.files[0];
      fileInput.files = e.dataTransfer.files;
      updateUI();
    }
  }

  function updateUI() {
    if (selectedFile) {
      dropZone.innerHTML = `
        <p>Selected file:</p>
        <p><strong>${selectedFile.name}</strong></p>
        <p>Size: ${formatFileSize(selectedFile.size)}</p>
        <button id="changeFileBtn">Change File</button>
      `;
      
      document.getElementById('changeFileBtn').addEventListener('click', () => {
        fileInput.value = '';
        selectedFile = null;
        dropZone.innerHTML = `
          <p>Drag & Drop your file here</p>
          <p>or</p>
          <button id="selectFileBtn">Select File</button>
        `;
        document.getElementById('selectFileBtn').addEventListener('click', () => fileInput.click());
        uploadBtn.disabled = true;
      });
      
      uploadBtn.disabled = !uploaderSelect.value;
    }
  }

  function handleUpload() {
    if (!selectedFile || !uploaderSelect.value) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('uploader', uploaderSelect.value);

    statusDiv.textContent = 'Uploading...';
    statusDiv.style.color = '#3498db';
    uploadBtn.disabled = true;

    fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Display the result
      resultContainer.style.display = 'block';
      resultContent.innerHTML = '';
      
      for (const [key, value] of Object.entries(data)) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${key}:</strong> <a href="${value}" target="_blank">${value}</a>`;
        resultContent.appendChild(p);
      }
      
      statusDiv.textContent = 'Upload successful!';
      statusDiv.style.color = '#2ecc71';
    })
    .catch(error => {
      console.error('Upload error:', error);
      statusDiv.textContent = `Error: ${error.message}`;
      statusDiv.style.color = '#e74c3c';
    })
    .finally(() => {
      uploadBtn.disabled = false;
    });
  }

  function copyResult() {
    const textToCopy = Array.from(resultContent.querySelectorAll('a'))
      .map(a => a.href)
      .join('\n');
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Enable upload button when both file and uploader are selected
  uploaderSelect.addEventListener('change', () => {
    uploadBtn.disabled = !(selectedFile && uploaderSelect.value);
  });
});
