
import React, { useRef, useState, forwardRef, useEffect } from 'react';
import { Check, Eye, StopCircle, Edit, CaseUpper, CaseLower, CaseSensitive, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '../Navbar/Navbar';
import { Navbar2 } from '../Navbar2/Navbar2';
import { baseUrl } from '../Config';
import { useLocation } from 'react-router-dom';
import './customQuill.css';
import OpenAiKeyManager from '../Pages/OpenAiKeyManager';
import PromptUpdate from '../PromptUpdate/PromptUpdate';
import SaveConfirmationModal from '../Pages/SaveConfirmationModal';
import UserProfileSidebar from '../Pages/UserProfileSidebar';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import FroalaEditor from 'react-froala-wysiwyg';
import 'froala-editor/js/plugins/align.min.js';
import 'froala-editor/js/plugins/code_beautifier.min.js';
import 'froala-editor/js/plugins/colors.min.js';
import 'froala-editor/js/plugins/draggable.min.js';
import 'froala-editor/js/plugins/emoticons.min.js';
import 'froala-editor/js/plugins/entities.min.js';
import 'froala-editor/js/plugins/file.min.js';
import 'froala-editor/js/plugins/font_family.min.js';
import 'froala-editor/js/plugins/font_size.min.js';
import 'froala-editor/js/plugins/image.min.js';
import 'froala-editor/js/plugins/image_manager.min.js';
import 'froala-editor/js/plugins/inline_style.min.js';
import 'froala-editor/js/plugins/line_breaker.min.js';
import 'froala-editor/js/plugins/link.min.js';
import 'froala-editor/js/plugins/lists.min.js';
import 'froala-editor/js/plugins/paragraph_format.min.js';
import 'froala-editor/js/plugins/paragraph_style.min.js';
import 'froala-editor/js/plugins/print.min.js';
import 'froala-editor/js/plugins/quick_insert.min.js';
import 'froala-editor/js/plugins/quote.min.js';
import 'froala-editor/js/plugins/save.min.js';
import 'froala-editor/js/plugins/table.min.js';
import 'froala-editor/js/plugins/video.min.js';
import 'froala-editor/js/plugins/url.min.js';
import 'froala-editor/js/plugins/word_paste.min.js';


const Home = forwardRef(() => {
  const froalaRef = useRef(null);
  const location = useLocation();
  const [allContent, setAllContent] = useState('');
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(0);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [fileName, setFileName] = useState('');
  const [isFileNameModalVisible, setIsFileNameModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDocId, setCurrentDocId] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [showKeyInput, setShowKeyInput] = useState();
  const [isShowPrompt, setIshShowPrompt] = useState();
  const [currentDate, setCurrentDate] = useState('');
  const [showIcon, setShowIcon] = useState(false);
  const [iconPosition, setIconPosition] = useState({ top: 0, left: 0 });
  const savedSelectionRef = useRef(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const containerRef = useRef(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Initialize content from location state
  useEffect(() => {
    if (location.state?.documentContent) {
      setAllContent(location.state.documentContent);
      setCurrentDate(location.state.documentDate);
      setFileName(location.state.documentName || '');
      setCurrentDocId(location.state.documentId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Function to split content into pages
  const splitContentIntoPages = (htmlContent) => {
    if (!htmlContent) return [''];

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '600px';
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    const pages = [];
    let currentPageContent = '';
    let currentHeight = 0;
    const OVERFLOW_THRESHOLD = 750;
    Array.from(tempDiv.children).forEach(child => {
        const childHeight = child.scrollHeight;

        if (currentHeight + childHeight > OVERFLOW_THRESHOLD) {
            if (currentPageContent.trim()) {
                pages.push(currentPageContent);
            }
            currentPageContent = child.outerHTML;
            currentHeight = childHeight;
        } else {
            currentPageContent += child.outerHTML;
            currentHeight += childHeight;
        }
    });

    if (currentPageContent.trim()) {
        pages.push(currentPageContent);
    }

    document.body.removeChild(tempDiv);
    return pages.length > 0 ? pages : [''];
};
  
  // Update pages when content changes
  useEffect(() => {
    const splitPages = splitContentIntoPages(allContent);
    setPages(splitPages);
  }, [allContent]);

  const handleEditorChange = (newContent) => {
    if (newContent === '<p><br></p>' || newContent === '') {
        return;
    }

    const editor = froalaRef.current?.editor;

    if (!editor) return;

    // Save selection before updating content
    const range = document.createRange();
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        range.setStart(selection.getRangeAt(0).startContainer, selection.getRangeAt(0).startOffset);
    }

    if (selectedPage < 0 || selectedPage >= pages.length) {
        console.error('Invalid selectedPage index');
        return;
    }

    const updatedPages = [...pages];
    updatedPages[selectedPage] = newContent;

    const combinedContent = updatedPages.join('');
    const newPages = splitContentIntoPages(combinedContent);

    if (newPages.length > updatedPages.length && selectedPage < newPages.length - 1) {
        setSelectedPage(selectedPage + 1);
    }

    // Update content
    setHasUnsavedChanges(true);
    setAllContent(combinedContent);
    setPages(newPages);

    // Restore selection after updating content
    if (selection.rangeCount > 0) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
};
  
  const handlePageSelect = (index) => {
    if (index < 0 || index >= pages.length) {
      console.warn('Invalid page index selected');
      return;
    }
    setSelectedPage(index);
    const editor = froalaRef.current?.editor;
    if (editor) {
      // Load the selected page content into the editor
      editor.html.set(pages[index]);
    }
  };
  
  const handleTextSelection = () => {
    if (froalaRef.current && !isAiProcessing) {
      const editor = froalaRef.current.editor;
      const selectedText = editor.selection.text();
      if (selectedText && selectedText.trim() !== '') {
        const selection = editor.selection.get();
        const bounds = editor.selection.element().getBoundingClientRect(); 
        savedSelectionRef.current = {
          start: selection.start,
          end: selection.end,
        };
  
        setIconPosition({
          top: bounds.top + window.scrollY - -150,
          left: bounds.left + bounds.width + window.scrollX - 10,
        });
        setShowIcon(true);
      } else {
        setShowIcon(false);
      }
    }
  };

  useEffect(() => {
    const editor = froalaRef.current?.editor;
    if (editor && editor.events) {
      const selectionChangedHandler = () => {
        handleTextSelection();
      };

      try {
        // Try specific Froala event methods first
        if (typeof editor.events.on === 'function') {
          editor.events.on('selection.changeend', selectionChangedHandler);
          editor.events.on('selection.change', selectionChangedHandler);
        }
        
        // Fallback to generic method if specific Froala methods fail
        if (typeof editor.selection.on === 'function') {
          editor.selection.on('change', selectionChangedHandler);
        }
      } catch (error) {
        console.error('Error setting up selection event listeners:', error);
      }

      // Return a cleanup function that safely removes event listeners
      return () => {
        try {
          if (editor.events && typeof editor.events.off === 'function') {
            editor.events.off('selection.changeend', selectionChangedHandler);
            editor.events.off('selection.change', selectionChangedHandler);
          }
          
          if (editor.selection && typeof editor.selection.off === 'function') {
            editor.selection.off('change', selectionChangedHandler);
          }
        } catch (error) {
          console.error('Error removing selection event listeners:', error);
        }
      };
    }
  }, [froalaRef.current]); 

  const removeBackgroundHighlights = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const elementsWithBackground = tempDiv.querySelectorAll(
      '[style*="background-color"],' + '[style*="background"],' + 'mark,' + '.highlight'
    );

    elementsWithBackground.forEach(el => {
      el.removeAttribute('style');
      if (el.tagName.toLowerCase() === 'mark') {
        const textNode = document.createTextNode(el.textContent);
        el.parentNode.replaceChild(textNode, el);
      }
      el.classList.remove('highlight');
    });

    return tempDiv.innerHTML;
  };

  // Export to Word document
  const handleExportToDoc = () => {
    const cleanedContent = removeBackgroundHighlights(allContent);
    const fileNameToExport = fileName || 'New Document';

    const styleContent = `
      <style>
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        h1, h2, h3, h4, h5, h6 { margin: 1em 0 0.5em 0; }
        ul, ol { margin: 1em 0; padding-left: 2em; }
        p { margin: 1em 0; }
        .ql-align-center { text-align: center; }
        .ql-align-right { text-align: right; }
        .ql-align-justify { text-align: justify; }
      </style>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Exported Document</title>
          ${styleContent}
        </head>
        <body>
          ${cleanedContent}
        </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${fileNameToExport}.doc`;
    downloadLink.click();
    URL.revokeObjectURL(url);
  };

  // Recording functions
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const wavBlob = await convertToWav(audioBlob);
        await sendAudioToBackend(wavBlob);
        stream.getTracks().forEach(track => track.stop());
        stopTimer();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

    }
  };

  const processAndUpdateContent = (aiResponse) => {
    try {
      setIsAiProcessing(true);
      const editor = froalaRef.current.editor;
  
      if (editor) {
        const selection = editor.selection.save(); // Save cursor position
        editor.undo.saveStep(); // Save current state
  
        editor.html.insert(aiResponse, true); // Insert the new content
  
        editor.undo.saveStep(); // Save the new state
        editor.selection.restore(selection); // Restore cursor position
      }
  
      const newContent = editor.html.get();
      handleEditorChange(newContent); // Update your app state
  
      setIsAiProcessing(false);
      setShowIcon(false);
    } catch (error) {
      console.error('Error processing content update:', error);
      setIsAiProcessing(false);
    }
  };
  


  // Audio processing functions
  const convertToWav = async (webmBlob) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000
    });
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const wavBuffer = audioContext.createBuffer(1, audioBuffer.length, 16000);
    wavBuffer.copyToChannel(audioBuffer.getChannelData(0), 0);

    const wavBlob = await new Promise(resolve => {
      const offlineContext = new OfflineAudioContext(1, wavBuffer.length, 16000);
      const source = offlineContext.createBufferSource();
      source.buffer = wavBuffer;
      source.connect(offlineContext.destination);
      source.start();

      offlineContext.startRendering().then(renderedBuffer => {
        const wav = new Blob([createWaveFileData(renderedBuffer)], { type: 'audio/wav' });
        resolve(wav);
      });
    });

    return wavBlob;
  };


  const createWaveFileData = (audioBuffer) => {
    const frameLength = audioBuffer.length;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numberOfChannels * bitsPerSample / 8;
    const blockAlign = numberOfChannels * bitsPerSample / 8;
    const wavDataByteLength = frameLength * numberOfChannels * 2;
    const headerByteLength = 44;
    const totalLength = headerByteLength + wavDataByteLength;
    const waveFileData = new Uint8Array(totalLength);
    const view = new DataView(waveFileData.buffer);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + wavDataByteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, wavDataByteLength, true);

    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < frameLength; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return waveFileData;
  };

  // Send audio to backend
  const sendAudioToBackend = async (audioBlob) => {
    try {
      setIsAiProcessing(true);
      const formData = new FormData();
      formData.append('audio', new File([audioBlob], 'recording.wav', { type: 'audio/wav' }));

      const editor = froalaRef.current.editor;
      // Get innerHTML of the selected content
      const selectedHtml = editor.selection.element() ? editor.selection.element().outerHTML : null;

      formData.append('selectedText', JSON.stringify(selectedHtml)); // Convert to JSON string

      const response = await fetch(`${baseUrl}/api/asr`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.chatResponse.mergedText) {
        processAndUpdateContent(data.chatResponse.mergedText);
      }
    } catch (error) {
      console.error('Error sending audio to ASR:', error);
      alert('Please Enter Your Correct Open AI API Key');
    } finally {
      setIsAiProcessing(false);
    }
  };



  // Handler for navigation with unsaved changes
  const handleNavigation = (path) => {
    if (hasUnsavedChanges) {
      setIsSaveConfirmationOpen(true);
      setPendingNavigation(path);
    } else {
      window.location.href = path;
    }
  };

  // Modal actions
  const handleSaveConfirmation = () => {
    handleSave();
    setIsSaveConfirmationOpen(false);
  };

  const handleDontSave = () => {
    setHasUnsavedChanges(false);
    setIsSaveConfirmationOpen(false);

    if (pendingNavigation) {
      window.location.href = pendingNavigation;
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setIsSaveConfirmationOpen(false);
    setPendingNavigation(null);
  };


  // Save document
  const handleSave = async () => {
    if (!fileName) {
      setIsFileNameModalVisible(true);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userEmail = user?.email;
      setIsLoading(true);
      const endpoint = currentDocId
        ? `${baseUrl}/api/documents/${currentDocId}`
        : `${baseUrl}/api/store-document`;

      const method = currentDocId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: allContent,
          fileName,
          documentId: currentDocId,
          userEmail: userEmail
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!currentDocId) {
          setCurrentDocId(data.documentId);
        }
        setHasUnsavedChanges(false);

        // Handle pending navigation if exists
        if (pendingNavigation) {
          window.location.href = pendingNavigation;
          setPendingNavigation(null);
        }
      } else {
        throw new Error('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const transformText = (transformType) => {
    const editor = froalaRef.current?.editor;
    if (!editor) return;
  
    // Get the selected text
    const selectedText = editor.selection.text(); // Correct Froala API method
    if (selectedText) {
      let transformedText = "";
  
      switch (transformType) {
        case "uppercase":
          transformedText = selectedText.toUpperCase();
          break;
        case "lowercase":
          transformedText = selectedText.toLowerCase();
          break;
        case "capitalize":
          transformedText = selectedText
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
          break;
        default:
          return;
      }
  
      // Replace the selected text with transformed text
      editor.selection.remove(); // Remove the selected text
      editor.html.insert(transformedText); // Insert the transformed text
    }
  };
  

  const CustomToolbar = () => (
    <div className="relative w-full">
      <div className="flex flex-wrap justify-end items-center absolute right-0 top-10 z-10 p-1 sm:p-1 lg:top-2 lg:right-0 md:top-2 md:right-0 w-fit">
        {/* Lowercase Button */}
        <button
          onClick={() => transformText("lowercase")}
          className="p-1 sm:p-1" aria-label="Convert to lowercase">
          <CaseLower className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        </button>
  
        {/* Uppercase Button */}
        <button
          onClick={() => transformText("uppercase")}
          className="p-1 sm:p-1" aria-label="Convert to uppercase">
          <CaseUpper className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        </button>
  
        {/* Capitalize Button */}
        <button
          onClick={() => transformText("capitalize")}
          className="p-1 sm:p-1" aria-label="Capitalize text">
          <CaseSensitive className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
  

  function formatDate(currentDate) {
    let date;

    // Check if currentDate is valid, otherwise use today's date
    if (currentDate) {
      date = new Date(currentDate);
    } else {
      date = new Date(); // Today's date
    }

    if (isNaN(date.getTime())) {
      date = new Date(); // Handle invalid date case
    }

    // Month names array
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Extract day, month, and year
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // Return formatted date
    return `${month} ${day}, ${year}`;
  }

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };
  
  const config = {
    placeholderText: 'Edit Your Content Here!',
    toolbarButtons: {
      'moreText': {
        'buttons': [
          'bold', 'italic', 'underline',
          'strikeThrough', 'subscript',
          'superscript', 'fontFamily',
          'fontSize', 'textColor',
          'backgroundColor', 'inlineClass',
          'clearFormatting',
          'alignLeft', 'alignCenter',
          'alignRight', 'alignJustify',
          'formatOL', 'formatUL',
          'outdent', 'indent',
          'quote',
        ]
      },
      'moreRich': {
        'buttons': [
          'insertLink', 'insertImage', 'insertTable',
        ]
      },
      'moreMisc': {
        'buttons': [
          'undo', 'redo',
        ]
      }
    },
    height: 350,
    heightMin: 200,
    heightMax: 400,
    charCounterCount: false,
    wordCounterCount: false,
    pluginsEnabled: [
      'table',
      'align',
      'colors',
      'fontFamily',
      'fontSize',
      'image',
      'link',
      'lists',
      'paragraphFormat',
      'paragraphStyle',
      'quote',
      'save',
      'url'
    ],
    imageUploadURL: '/upload-image',
    imageUploadParams: {
      id: 'my_editor'
    },
    events: {
      'content.changed': function () {
        console.log('Content changed');
      },
      'image.beforeUpload': function (images) {
        console.log('Before image upload');
      },
      'contentChanged': handleTextSelection, // Fires when content changes
      'mouseup': handleTextSelection,       // Fires when mouse selection occurs
      'keydown': handleTextSelection,       // Fires when keyboard selection occurs
    },
    language: 'en_us',
    pastePlain: false,
    wordPasteModal: true,
    quickInsertEnabled: true,
    quickInsertTags: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'blockquote'],
  };
  

  return (
    <div className="form-field relative">
      <Navbar />
      {isLoading ? (
        <div className='flex justify-center items-center min-h-screen'>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="popup">
          {/* Sidebar - Responsive Width and Positioning */}
          <div className="thumbnails-sidebar  lg:min-h-[91vh] md:min-h-[91vh]">
            <div className='mt-8'>
              <Navbar2 onNavigate={handleNavigation} />
            </div>
            <div className='flex justify-center w-full mb-3 mt-3 bg-[#E2E8F0]'>
              <hr />
            </div>
            {/* Desktop thumbnail section  */}
            <div className=' hidden lg:flex lg:flex-col lg:items-center md:flex md:flex-col md:items-center'>
              {pages.map((pageContent, index) => {
                // Create a modified version of the pageContent with reduced font sizes and margins
                const thumbnailContent = pageContent
                  .replace(/font-size:(\d+)px/g, 'font-size:3px')
                  .replace(/margin:[^;]+;/g, 'margin:0px;')
                  .replace(/margin-top:[^;]+;/g, 'margin-top:0px;')
                  .replace(/margin-right:[^;]+;/g, 'margin-right:0px;')
                  .replace(/margin-bottom:[^;]+;/g, 'margin-bottom:0px;')
                  .replace(/margin-left:[^;]+;/g, 'margin-left:0px;')
                  .replace(/line-height:[^;]+;/g, 'line-height:normal')
                  .replace(/width:[^;]+;/g, 'width:100%');
                return (
                  <div
                    key={index}
                    className={`thumbnail-page text-[5px] m-0 p-0 ${selectedPage === index ? 'selected' : ''}`}
                    onClick={() => handlePageSelect(index)}
                  >
                    <div className="text-[5px] text-center m-0 p-0">Document {index + 1}</div>
                    <div
                      className="thumbnail-preview m-0 p-0"
                      dangerouslySetInnerHTML={{ __html: thumbnailContent }}
                    />
                  </div>
                );
              })}
            </div>
            {/* Mobile section section */}
            <div className="flex items-center justify-center w-full relative md:hidden lg:hidden">
              {/* Left Arrow */}
              <button
                onClick={scrollRight}
                className="absolute left-0 z-10 bg-gray-200 hover:bg-gray-300 rounded-full p-2 m-2"
              >
                <ChevronLeft size={24} />
              </button>
              {/* Thumbnail Container */}
              <div
                ref={containerRef}
                className="flex overflow-x-auto space-x-4 scrollbar-hide max-w-[calc(100%-100px)] no-scrollbar"
              >
                {pages.map((pageContent, index) => (
                  <div
                    key={index}
                    className={`thumbnail-page cursor-pointer flex-shrink-0 text-[5px] ${selectedPage === index ? 'selected' : ''}`}
                    onClick={() => handlePageSelect(index)}
                  >
                    <div className="text-[5px] text-center">Document {index + 1}</div>
                    <div
                      className="thumbnail-preview"
                      dangerouslySetInnerHTML={{ __html: pageContent }}
                    />
                  </div>
                ))}
              </div>
              {/* Right Arrow */}
              <button
                onClick={scrollRight}
                className="absolute right-0 z-10 bg-gray-200 hover:bg-gray-300 rounded-full p-2 m-2"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            <div className='relative hidden lg:block '>
              <UserProfileSidebar />
            </div>
          </div>
          {/* Editor Container - Responsive Width and Padding */}
          <div className="editor-container flex-grow pt-2 md:pt-2 bg-[#E2E8F0]">
            <div className='w-full max-w-3xl mx-auto bg-[#F8FAFC] min-h-[90vh] rounded-t-lg'>
              {!isPreviewVisible ? (
                <>
                  {/* Header with Responsive Layout */}
                  <div className='flex flex-col sm:flex-row justify-between lg:bg-white w-full lg:p-4 rounded-t-lg items-center'>
                    <div className='mb-2 sm:mb-0'>
                      <p className='text-sm hidden lg:block'>Last Update: {formatDate(currentDate)}</p>
                    </div>
                    <div className='fixed bottom-60 right-0 z-50 md:static md:flex md:max-w-60 md:w-full md:gap-3 md:flex-wrap md:justify-center lg:max-w-60 lg:w-full lg:p-4 lg:flex lg:gap-3 lg:flex-wrap lg:justify-center sm:justify-end '>
                      <button
                        onClick={() => setIsPreviewVisible(true)}
                        className="flex items-center gap-2 px-2 py-2 bg-[#FF9D00] lg:bg-white text-sm lg:border text-white lg:text-[#475569] rounded mb-3  sm:mb-0"
                      >
                        <Eye className="w-6 h-5" />
                        <p className="hidden md:inline text-sm">Preview</p>
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-2 py-2 lg:px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        <Check className="w-6 h-5" />
                        <p className="hidden md:inline text-sm">Save</p>
                      </button>
                    </div>
                  </div>
                  {/* Editor with Responsive Width */}
                  <div className='px-4'>
                    <CustomToolbar />
                    <FroalaEditor
                      ref={froalaRef}
                      model={pages[selectedPage] || ''}
                      onModelChange={handleEditorChange}
                      className="bg-white rounded-lg w-full mt-5"
                      config={config}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Preview Header - Same Responsive Layout as Editor Header */}
                  <div className='flex flex-col sm:flex-row justify-between lg:bg-white w-full lg:p-4 rounded-t-lg'>
                    <div className='mb-2 sm:mb-0'>
                      <p className='text-sm hidden lg:block'>Last Update: {formatDate(currentDate)}</p>
                    </div>
                    <div className='fixed bottom-60 right-0 z-50 md:static md:flex md:max-w-60 md:w-full md:gap-3 md:flex-wrap md:justify-center lg:max-w-60 lg:w-full lg:p-4 lg:flex lg:gap-3 lg:flex-wrap lg:justify-center sm:justify-end'>
                      <button
                        onClick={() => setIsPreviewVisible(false)}
                        className="flex items-center gap-2 px-2 py-2 bg-[#FF9D00] lg:bg-white text-sm lg:border text-white lg:text-[#475569] rounded mb-3 sm:mb-0"
                      >
                        <Edit className="w-6 h-5" />
                        <p className='hidden md:inline text-sm'>Edit</p>
                      </button>

                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-2 py-2 lg:px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={isLoading}
                      >
                        <Check className="w-6 h-5" />
                        <p className="hidden md:inline text-sm">Save</p>
                      </button>
                    </div>
                  </div>
                  {/* Preview Content with Responsive Width and Scrolling */}
                  <div
                    className="bg-white rounded-lg w-full max-h-[70vh] overflow-y-auto p-4 md:p-6 text-sm ql-editor"
                    style={{
                      fontFamily: 'inherit',
                      lineHeight: '2.5',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: removeBackgroundHighlights(allContent) || pages[selectedPage]
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Icons Container - Responsive Positioning */}
          <div className="fixed bottom-4 right-0 z-50 md:static md:max-w-56 md:w-full lg:max-w-56 lg:w-full lg:p-4 lg:bg-[#F9FAFB]">
            <div className="flex flex-col gap-2 w-full items-end">
              {!isRecording ? (
                <button
                  title="Start Recording"
                  className="flex items-center gap-2 bg-[#00B244] text-white p-2 rounded hover:bg-green-600 w-full"
                  onClick={startRecording}
                >
                  <img src='./Images/mic_icon.svg' className="w-6 h-6" alt='mic_icon' />
                  <span className="hidden md:inline text-sm">Speak</span>
                </button>
              ) : (
                <button
                  title="Stop Recording"
                  className="lg:flex lg:items-center md:flex md:items-center gap-2 bg-[#D92D20] text-white p-2 rounded hover:bg-red-700 md:w-full lg:w-full"
                  onClick={stopRecording}
                >
                  <StopCircle className="w-6 h-6" />
                  <span className="hidden md:inline text-sm">Stop Recording</span>
                </button>
              )}

              {isRecording && (
                <div className="text-xs text-red-500 text-center">
                  Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
            {/* Other Icons with Responsive Display */}
            <div className="flex flex-col gap-2  w-full items-end ">
              <button
                onClick={handleExportToDoc}
                className="flex items-center gap-2 text-gray-700 p-2 rounded border border-gray-300 mt-2 bg-white md:w-full lg:w-full"
                title="Export to Word File"
              >
                <img src='./Images/download_icon.svg' className="w-6 h-6" alt='download_icon' />
                <span className="hidden md:inline">Download</span>
              </button>

              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="flex items-center gap-2 text-gray-700 p-2 rounded border border-gray-300 bg-white md:w-full lg:w-full"
                title="Enter Your Open AI Key"
              >
                <img src='./Images/openAI_icon.svg' className="w-6 h-6" alt='openAi_icon' />
                <span className="hidden md:inline text-sm">Open AI Key</span>
              </button>

              <button onClick={() => setIshShowPrompt(true)}
                className="flex items-center gap-2 text-gray-700 p-2 rounded border border-gray-300 bg-white md:w-full lg:w-full"
              >
                <img src='./Images/prompt_icon.svg' className="w-6 h-6" alt='prompt_icon' />
                <span className="hidden md:inline text-sm">Update Prompt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isFileNameModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4 text-center">Name of the Document</h2>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Name of the Document"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsFileNameModalVisible(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (fileName) {
                    setIsFileNameModalVisible(false);
                    handleSave();
                  } else {
                    alert('Please enter a file name');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" > Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showKeyInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
          <div className="openAiTextarea bg-white p-4 rounded  ">
            <div className="flex justify-end mb-2">
              <p onClick={() => setShowKeyInput(false)} className="cursor-pointer text-white flex justify-center items-center w-8 h-8 bg-black rounded-full" >
                X
              </p>
            </div>
            <OpenAiKeyManager />
          </div>
        </div>
      )}

      {isShowPrompt && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={(e) => { if (e.target === e.currentTarget) {  setIshShowPrompt(false); } }}>
          <PromptUpdate onClose={() => setIshShowPrompt(false)} />
        </div>
      )}

      <SaveConfirmationModal
        isOpen={isSaveConfirmationOpen}
        fileName={fileName}
        onSave={handleSaveConfirmation}
        onDontSave={handleDontSave}
        onCancel={handleCancelNavigation}
      />

{showIcon && (
    <div
      style={{
        position: 'absolute',
        top: iconPosition.top,
        left: iconPosition.left,
        cursor: 'pointer',
        width: '50px',
        zIndex: 1000,  // Ensure it's above other elements
        display: 'block'  // Always display, not just on md screens
      }}
    >
      {!isRecording ? (
        <button
          title="Start Recording"
          className="recording-mic-btn justify-center bg-[#00B244]"
          onClick={startRecording}
        >
          <img
            src="./Images/mic_icon.svg"
            className="recording-mic-icon"
            alt="selected_mic_icon"
          />
        </button>
      ) : (
        <button
          title="Stop Recording"
          className="recording-mic-btn p-0 justify-center bg-[#D92D20]"
          onClick={stopRecording}
        >
          <StopCircle
            className="recording-mic-icon"
          />
        </button>
      )}
    </div>
  )}
    </div>
  );
});

export default Home; 