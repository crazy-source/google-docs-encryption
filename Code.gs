/**
 * Google Docs Encryption Apps Script
 * Encrypts and decrypts selected text using AES-256-CBC with PBKDF2 key derivation
 * 
 * Author: Based on Technical Specification Document
 * Date: June 2025
 */

// Global variable to store CryptoJS library
var CryptoJS = null;

/**
 * Runs when the document is opened, adds custom menu
 */
function onOpen() {
  var ui = DocumentApp.getUi();
  ui.createMenu('🔐 Encryption')
    .addItem('Encrypt Selection', 'encryptSelection')
    .addItem('Decrypt Selection', 'decryptSelection')
    .addSeparator()
    .addItem('About', 'showAbout')
    .addToUi();
}

/**
 * Enhanced CryptoJS loading with better error handling
 */
function loadCryptoJS() {
  if (CryptoJS !== null && typeof CryptoJS !== 'undefined') {
    return true; // Already loaded
  }
  
  try {
    Logger.log('Loading CryptoJS library...');
    
    var response = UrlFetchApp.fetch('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
    var cryptoCode = response.getContentText();
    
    Logger.log('CryptoJS code length: ' + cryptoCode.length);
    
    // More robust evaluation
    var globalScope = (function() { return this; })();
    eval(cryptoCode);
    CryptoJS = globalScope.CryptoJS;
    
    if (typeof CryptoJS === 'undefined' || CryptoJS === null) {
      throw new Error('CryptoJS object not found after evaluation');
    }
    
    // Test basic CryptoJS functionality
    var testHash = CryptoJS.SHA256('test').toString();
    Logger.log('CryptoJS test hash: ' + testHash);
    
    if (!testHash || testHash.length === 0) {
      throw new Error('CryptoJS functionality test failed');
    }
    
    Logger.log('CryptoJS loaded successfully');
    return true;
    
  } catch (error) {
    Logger.log('CryptoJS loading error: ' + error.toString());
    DocumentApp.getUi().alert('Encryption Library Error', 
                             'Failed to load encryption library:\n\n' + error.toString() + 
                             '\n\nPlease check:\n' +
                             '1. Internet connection\n' +
                             '2. Apps Script permissions\n' +
                             '3. Try again in a few minutes', 
                             DocumentApp.getUi().ButtonSet.OK);
    return false;
  }
}


/**
 * Enhanced text extraction that properly handles line breaks and formatting
 * @param {Selection} selection - Google Docs selection object
 * @return {string} - Extracted text with preserved line breaks
 */
function extractSelectedText(selection) {
  var selectedText = '';
  var elements = selection.getSelectedElements();
  
  Logger.log('Number of selected elements: ' + elements.length);
  
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    var elementType = element.getElement().getType();
    
    Logger.log('Element ' + i + ' type: ' + elementType);
    
    switch (elementType) {
      case DocumentApp.ElementType.TEXT:
        var textElement = element.getElement().asText();
        var text = '';
        
        if (element.isPartial()) {
          var start = element.getStartOffset();
          var end = element.getEndOffsetInclusive();
          text = textElement.getText().substring(start, end + 1);
        } else {
          text = textElement.getText();
        }
        
        selectedText += text;
        Logger.log('Text extracted: "' + text.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"');
        break;
        
      case DocumentApp.ElementType.PARAGRAPH:
        var paragraph = element.getElement().asParagraph();
        var paragraphText = paragraph.getText();
        
        // Add paragraph text
        selectedText += paragraphText;
        
        // Add line break after paragraph (except for the last element)
        if (i < elements.length - 1) {
          selectedText += '\n';
        }
        
        Logger.log('Paragraph text: "' + paragraphText.replace(/\n/g, '\\n') + '"');
        break;
        
      case DocumentApp.ElementType.LIST_ITEM:
        var listItem = element.getElement().asListItem();
        var listText = listItem.getText();
        
        // Add list item text
        selectedText += listText;
        
        // Add line break after list item (except for the last element)
        if (i < elements.length - 1) {
          selectedText += '\n';
        }
        
        Logger.log('List item text: "' + listText.replace(/\n/g, '\\n') + '"');
        break;
        
      default:
        // Try to get text from other element types
        try {
          var text = element.getElement().getText();
          if (text) {
            selectedText += text;
            // Add line break for block elements
            if (elementType === DocumentApp.ElementType.TABLE_CELL ||
                elementType === DocumentApp.ElementType.TABLE_ROW) {
              selectedText += '\n';
            }
          }
        } catch (e) {
          Logger.log('Could not extract text from element type: ' + elementType);
        }
        break;
    }
  }
  
  Logger.log('Final extracted text with line breaks: "' + selectedText.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"');
  Logger.log('Text length: ' + selectedText.length);
  
  return selectedText;
}

/**
 * Normalize line breaks to ensure consistency
 * @param {string} text - Text to normalize
 * @return {string} - Text with normalized line breaks
 */
function normalizeLineBreaks(text) {
  // Convert all line breaks to \n for consistency
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
/**
 * Updated encrypt selection function with improved text extraction
 */
function encryptSelection() {
  var ui = DocumentApp.getUi();
  
  // Load CryptoJS library
  if (!loadCryptoJS()) {
    return;
  }
  
  try {
    // Get the active document and selection
    var doc = DocumentApp.getActiveDocument();
    var selection = doc.getSelection();
    
    if (!selection) {
      ui.alert('No Selection', 'Please select some text to encrypt.', ui.ButtonSet.OK);
      return;
    }
    
    var elements = selection.getSelectedElements();
    if (elements.length === 0) {
      ui.alert('No Selection', 'Please select some text to encrypt.', ui.ButtonSet.OK);
      return;
    }
    
    // Extract selected text using improved function
    var selectedText = extractSelectedText(selection);
    
    if (selectedText.trim() === '') {
      // Show more detailed error information
      ui.alert('Empty Selection', 
               'The selected text appears to be empty.\n\n' +
               'Selected elements: ' + elements.length + '\n' +
               'Raw text length: ' + selectedText.length + '\n\n' +
               'Please try:\n' +
               '1. Select text by clicking and dragging\n' +
               '2. Ensure you\'re selecting actual text content\n' +
               '3. Check the browser console for detailed logs', 
               ui.ButtonSet.OK);
      return;
    }
    
    // Get password from user
    var password = getPassword('Enter password for encryption:');
    if (!password) {
      return; // User cancelled
    }
    
    // Encrypt the text
    var encryptedText = encryptText(selectedText, password);
    if (!encryptedText) {
      ui.alert('Encryption Failed', 'Failed to encrypt the selected text. Please try again.', ui.ButtonSet.OK);
      return;
    }
    
    // Replace selected text with encrypted version
    replaceSelectedText(selection, encryptedText);
    
    ui.alert('Success', 'Text encrypted successfully!\n\nOriginal length: ' + selectedText.length + ' characters', ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert('Error', 'Encryption failed: ' + error.toString(), ui.ButtonSet.OK);
    Logger.log('Encryption error: ' + error.toString());
  }
}

/**
 * Updated decrypt selection function with improved text extraction
 */
function decryptSelection() {
  var ui = DocumentApp.getUi();
  
  // Load CryptoJS library
  if (!loadCryptoJS()) {
    return;
  }
  
  try {
    // Get the active document and selection
    var doc = DocumentApp.getActiveDocument();
    var selection = doc.getSelection();
    
    if (!selection) {
      ui.alert('No Selection', 'Please select encrypted text to decrypt.', ui.ButtonSet.OK);
      return;
    }
    
    var elements = selection.getSelectedElements();
    if (elements.length === 0) {
      ui.alert('No Selection', 'Please select encrypted text to decrypt.', ui.ButtonSet.OK);
      return;
    }
    
    // Extract selected text using improved function
    var selectedText = extractSelectedText(selection);
    
    if (selectedText.trim() === '') {
      // Show more detailed error information
      ui.alert('Empty Selection', 
               'The selected text appears to be empty.\n\n' +
               'Selected elements: ' + elements.length + '\n' +
               'Raw text length: ' + selectedText.length + '\n\n' +
               'Please try:\n' +
               '1. Select the encrypted text by clicking and dragging\n' +
               '2. Ensure you\'re selecting the complete encrypted string\n' +
               '3. Check the browser console for detailed logs', 
               ui.ButtonSet.OK);
      return;
    }
    
    // Get password from user
    var password = getPassword('Enter password for decryption:');
    if (!password) {
      return; // User cancelled
    }
    
    // Decrypt the text
    var decryptedText = decryptText(selectedText, password);
    if (decryptedText === null) {
      ui.alert('Decryption Failed', 'Failed to decrypt the selected text. Please check your password and try again.', ui.ButtonSet.OK);
      return;
    }
    
    // Replace selected text with decrypted version
    replaceSelectedText(selection, decryptedText);
    
    ui.alert('Success', 'Text decrypted successfully!\n\nDecrypted length: ' + decryptedText.length + ' characters', ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert('Error', 'Decryption failed: ' + error.toString(), ui.ButtonSet.OK);
    Logger.log('Decryption error: ' + error.toString());
  }
}


/**
 * Generate random WordArray using Apps Script's Math.random()
 * @param {number} bytes - Number of bytes to generate
 * @return {WordArray} - CryptoJS WordArray with random data
 */
function generateRandomWordArray(bytes) {
  var words = [];
  var wordsNeeded = Math.ceil(bytes / 4);
  
  for (var i = 0; i < wordsNeeded; i++) {
    // Generate 4 random bytes (32 bits)
    var randomWord = 0;
    for (var j = 0; j < 4; j++) {
      randomWord = (randomWord << 8) | Math.floor(Math.random() * 256);
    }
    words.push(randomWord);
  }
  
  var wordArray = CryptoJS.lib.WordArray.create(words);
  wordArray.sigBytes = bytes; // Set the actual number of significant bytes
  
  return wordArray;
}

/**
 * Enhanced encryption that preserves line breaks
 */
function encryptText(plaintext, password) {
  try {
    Logger.log('Starting encryption...');
    
    // Normalize line breaks before encryption
    var normalizedText = normalizeLineBreaks(plaintext);
    Logger.log('Normalized text: "' + normalizedText.replace(/\n/g, '\\n') + '"');
    Logger.log('Original length: ' + plaintext.length + ', Normalized length: ' + normalizedText.length);
    
    // Verify CryptoJS is available
    if (typeof CryptoJS === 'undefined' || CryptoJS === null) {
      throw new Error('CryptoJS library not available');
    }
    
    // Generate random salt and IV
    var salt = generateRandomWordArray(32);
    var iv = generateRandomWordArray(16);
    
    Logger.log('Salt generated: ' + salt.toString(CryptoJS.enc.Hex).substring(0, 16) + '...');
    Logger.log('IV generated: ' + iv.toString(CryptoJS.enc.Hex));
    
    // Derive key using PBKDF2
    var key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 1000
    });
    
    // Encrypt the normalized text
    var encrypted = CryptoJS.AES.encrypt(normalizedText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    Logger.log('Text encrypted successfully');
    
    // Combine salt + IV + ciphertext as hex
    var combined = salt.toString(CryptoJS.enc.Hex) + 
                   iv.toString(CryptoJS.enc.Hex) + 
                   encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    
    // Convert to Base64 for storage
    var result = CryptoJS.enc.Hex.parse(combined).toString(CryptoJS.enc.Base64);
    
    Logger.log('Encryption completed. Result length: ' + result.length);
    
    return result;
    
  } catch (error) {
    Logger.log('Encryption error details: ' + error.toString());
    return null;
  }
}

/**
 * Enhanced decryption that preserves line breaks
 */
function decryptText(ciphertext, password) {
  try {
    Logger.log('Starting decryption...');
    
    // Verify CryptoJS is available
    if (typeof CryptoJS === 'undefined' || CryptoJS === null) {
      throw new Error('CryptoJS library not available');
    }
    
    // Convert from Base64 and parse as hex
    var combined = CryptoJS.enc.Base64.parse(ciphertext).toString(CryptoJS.enc.Hex);
    
    // Extract components
    var saltHex = combined.substr(0, 64);
    var ivHex = combined.substr(64, 32);
    var ciphertextHex = combined.substr(96);
    
    // Convert hex strings back to WordArrays
    var salt = CryptoJS.enc.Hex.parse(saltHex);
    var iv = CryptoJS.enc.Hex.parse(ivHex);
    var ciphertextWords = CryptoJS.enc.Hex.parse(ciphertextHex);
    
    // Derive the same key
    var key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 1000
    });
    
    // Create cipherParams object
    var cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertextWords
    });
    
    // Decrypt
    var decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Convert to string
    var plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (plaintext === '') {
      throw new Error('Decryption resulted in empty string - likely wrong password');
    }
    
    Logger.log('Decrypted text with line breaks: "' + plaintext.replace(/\n/g, '\\n') + '"');
    Logger.log('Decryption completed. Result length: ' + plaintext.length);
    
    return plaintext;
    
  } catch (error) {
    Logger.log('Decryption error details: ' + error.toString());
    return null;
  }
}

/**
 * Test the random number generation
 */
function testRandomGeneration() {
  Logger.log('Testing random generation...');
  
  if (!loadCryptoJS()) {
    Logger.log('Failed to load CryptoJS');
    return;
  }
  
  try {
    // Test our custom random function
    var randomBytes = generateRandomWordArray(16);
    Logger.log('Generated random bytes: ' + randomBytes.toString(CryptoJS.enc.Hex));
    
    var randomBytes2 = generateRandomWordArray(16);
    Logger.log('Generated random bytes 2: ' + randomBytes2.toString(CryptoJS.enc.Hex));
    
    // They should be different
    if (randomBytes.toString() === randomBytes2.toString()) {
      Logger.log('WARNING: Generated identical random values');
    } else {
      Logger.log('Random generation working correctly');
    }
    
    DocumentApp.getUi().alert('Random Generation Test', 'Random number generation test completed. Check logs for details.', DocumentApp.getUi().ButtonSet.OK);
    
  } catch (error) {
    Logger.log('Random generation test error: ' + error.toString());
  }
}


/**
 * Prompts user for password with validation
 * @param {string} prompt - Prompt message
 * @return {string|null} - Password or null if cancelled
 */
function getPassword(prompt) {
  var ui = DocumentApp.getUi();
  
  var response = ui.prompt('Password Required', prompt + '\n\n(Recommended: 12+ characters with mixed case, numbers, and symbols)', ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() === ui.Button.CANCEL) {
    return null;
  }
  
  var password = response.getResponseText().trim();
  
  if (password === '') {
    ui.alert('Invalid Password', 'Password cannot be empty.', ui.ButtonSet.OK);
    return null;
  }
  
  if (password.length < 8) {
    var continueResponse = ui.alert('Weak Password', 'Password is less than 8 characters. This is not recommended for security.\n\nDo you want to continue anyway?', ui.ButtonSet.YES_NO);
    if (continueResponse === ui.Button.NO) {
      return null;
    }
  }
  
  return password;
}

/**
 * Enhanced text replacement that properly handles line breaks
 * @param {Selection} selection - Google Docs selection object
 * @param {string} newText - Text to replace selection with
 */
function replaceSelectedText(selection, newText) {
  try {
    Logger.log('Replacing selected text...');
    Logger.log('New text with line breaks: "' + newText.replace(/\n/g, '\\n') + '"');
    
    var elements = selection.getSelectedElements();
    
    if (elements.length === 0) {
      throw new Error('No elements selected');
    }
    
    // Get the parent container of the first element
    var firstElement = elements[0].getElement();
    var parent = firstElement.getParent();
    
    // Find the position to insert new content
    var insertIndex = parent.getChildIndex(firstElement);
    
    // Remove all selected elements
    for (var i = elements.length - 1; i >= 0; i--) {
      var element = elements[i].getElement();
      if (element.getParent() === parent) {
        element.removeFromParent();
      }
    }
    
    // Split text by line breaks and insert as separate paragraphs
    var lines = newText.split('\n');
    
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      
      if (i === 0 && lines.length === 1) {
        // Single line - insert as simple text
        var newParagraph = parent.insertParagraph(insertIndex, line);
      } else if (i === 0) {
        // First line of multiple lines
        var newParagraph = parent.insertParagraph(insertIndex, line);
      } else {
        // Subsequent lines
        var newParagraph = parent.insertParagraph(insertIndex + i, line);
      }
    }
    
    Logger.log('Text replacement completed with ' + lines.length + ' lines');
    
  } catch (error) {
    Logger.log('Text replacement error: ' + error.toString());
    
    // Fallback: try simple replacement
    try {
      var elements = selection.getSelectedElements();
      if (elements.length > 0) {
        var firstElement = elements[0];
        if (firstElement.getElement().getType() === DocumentApp.ElementType.TEXT) {
          var textElement = firstElement.getElement().asText();
          if (firstElement.isPartial()) {
            textElement.deleteText(firstElement.getStartOffset(), firstElement.getEndOffsetInclusive());
            textElement.insertText(firstElement.getStartOffset(), newText);
          } else {
            textElement.setText(newText);
          }
          Logger.log('Fallback text replacement completed');
        }
      }
    } catch (fallbackError) {
      Logger.log('Fallback replacement also failed: ' + fallbackError.toString());
      throw error;
    }
  }
}

/**
 * Shows information about the script
 */
function showAbout() {
  var ui = DocumentApp.getUi();
  ui.alert('About Encryption Script', 
           'Google Docs Encryption Add-on\n\n' +
           '• Uses AES-256-CBC encryption\n' +
           '• PBKDF2 key derivation (10,000 iterations)\n' +
           '• Each encryption uses a unique salt and IV\n' +
           '• Passwords are never stored\n\n' +
           'Security Note: Google Docs keeps version history. ' +
           'Previous unencrypted versions may still be accessible through document history.\n\n' +
           'WARNING: If you lose your password, decryption is impossible!', 
           ui.ButtonSet.OK);
}

/**
 * Test function to verify encryption/decryption works
 */
function testEncryptionDetailed() {
  Logger.log('=== Starting detailed encryption test ===');
  
  // Test CryptoJS loading
  if (!loadCryptoJS()) {
    Logger.log('TEST FAILED: Could not load CryptoJS');
    return;
  }
  
  var testText = "Hello World! This is a test message.";
  var testPassword = "testPassword123";
  
  Logger.log('Test text: ' + testText);
  Logger.log('Test password: ' + testPassword);
  
  // Test encryption
  var encrypted = encryptText(testText, testPassword);
  if (!encrypted) {
    Logger.log('TEST FAILED: Encryption returned null');
    return;
  }
  
  Logger.log('Encrypted result: ' + encrypted.substring(0, 50) + '...');
  
  // Test decryption
  var decrypted = decryptText(encrypted, testPassword);
  if (!decrypted) {
    Logger.log('TEST FAILED: Decryption returned null');
    return;
  }
  
  Logger.log('Decrypted result: ' + decrypted);
  
  // Verify match
  if (testText === decrypted) {
    Logger.log('TEST PASSED: Encryption and decryption work correctly');
    DocumentApp.getUi().alert('Test Successful', 'Encryption test passed!\n\nThe encryption system is working correctly.', DocumentApp.getUi().ButtonSet.OK);
  } else {
    Logger.log('TEST FAILED: Decrypted text does not match original');
    Logger.log('Expected: ' + testText);
    Logger.log('Got: ' + decrypted);
  }
}

/**
 * Test function for line break handling
 */
function testLineBreakHandling() {
  Logger.log('=== Testing line break handling ===');
  
  if (!loadCryptoJS()) {
    Logger.log('Failed to load CryptoJS');
    return;
  }
  
  var testTexts = [
    "Single line text",
    "Line 1\nLine 2",
    "Line 1\nLine 2\nLine 3",
    "Line 1\r\nLine 2\r\nLine 3",
    "Mixed\nline\r\nbreaks\rhere"
  ];
  
  var password = "testPassword123";
  
  for (var i = 0; i < testTexts.length; i++) {
    var original = testTexts[i];
    Logger.log('Testing text ' + (i + 1) + ': "' + original.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"');
    
    var encrypted = encryptText(original, password);
    if (!encrypted) {
      Logger.log('Encryption failed for text ' + (i + 1));
      continue;
    }
    
    var decrypted = decryptText(encrypted, password);
    if (!decrypted) {
      Logger.log('Decryption failed for text ' + (i + 1));
      continue;
    }
    
    var normalized = normalizeLineBreaks(original);
    if (decrypted === normalized) {
      Logger.log('✓ Test ' + (i + 1) + ' PASSED');
    } else {
      Logger.log('✗ Test ' + (i + 1) + ' FAILED');
      Logger.log('Expected: "' + normalized.replace(/\n/g, '\\n') + '"');
      Logger.log('Got: "' + decrypted.replace(/\n/g, '\\n') + '"');
    }
  }
  
  DocumentApp.getUi().alert('Line Break Test', 'Line break handling test completed. Check logs for detailed results.', DocumentApp.getUi().ButtonSet.OK);
}