# Google Docs Encryption Add-on

```
DISCLAIMER: This script as well as the documentations have me vibe coded.

```

A Google Apps Script that provides AES-256 encryption and decryption for selected text within Google Docs. Protect sensitive content with password-based encryption directly in your documents.


- **🔐 Strong Encryption**: AES-256-CBC with PBKDF2 key derivation (1,000 iterations)
- **📝 Seamless Integration**: Custom menu in Google Docs for easy access
- **🔤 Text Preservation**: Maintains line breaks and handles multi-line content
- **🛡️ Security Focused**: Passwords never stored or logged
- **⚡ Real-time Processing**: Instant encryption/decryption of selected text
- **🔧 Error Handling**: Comprehensive error messages and fallback mechanisms
- **🌐 No External Dependencies**: Works entirely within Google's ecosystem

## 🚀 Quick Start

### Installation

1. **Open Google Apps Script**
   - Go to your Google Doc
   - Click **Extensions → Apps Script**

2. **Add the Script**
   - Delete any existing code in the editor
   - Copy and paste the entire script from `encryption-script.gs`
   - Save the project (Ctrl+S or Cmd+S)

3. **Grant Permissions**
   - Click **Run** button or run the `onOpen` function
   - Review and accept required permissions:
     - Access to Google Docs
     - Access to external URLs (for CryptoJS library)

4. **Verify Installation**
   - Return to your Google Doc and refresh the page
   - Look for the **🔐 Encryption** menu in the menu bar

## 📖 Usage

### Encrypting Text

1. **Select** any text in your Google Doc
2. Click **🔐 Encryption → Encrypt Selection**
3. **Enter a strong password** when prompted
4. The selected text will be replaced with encrypted ciphertext

### Decrypting Text

1. **Select** the encrypted text (ciphertext)
2. Click **🔐 Encryption → Decrypt Selection**  
3. **Enter the same password** used for encryption
4. The encrypted text will be replaced with the original content

### Example Workflow

```
Original text: "This is confidential information"
                      ↓ (Encrypt with password "mySecurePass123")
Encrypted text: "U2FsdGVkX1+8xvzQx2J3mQ8kL7..."
                      ↓ (Decrypt with same password)
Decrypted text: "This is confidential information"
```

## 🔒 Security Features

### Cryptographic Specifications

- **Algorithm**: AES-256-CBC (Advanced Encryption Standard)
- **Key Derivation**: PBKDF2 with 1,000 iterations
- **Salt**: 256-bit random salt per encryption
- **IV**: 128-bit random initialization vector per encryption
- **Library**: CryptoJS 4.1.1 (loaded from CDN)

### Security Best Practices

- **Strong Passwords**: Minimum 8 characters recommended (12+ preferred)
- **Unique Salt/IV**: Each encryption uses cryptographically random values
- **No Password Storage**: Passwords are never saved or logged
- **Forward Secrecy**: Each encryption is completely independent

## ⚠️ Important Security Notes

### Document History
- Google Docs maintains version history
- Previous unencrypted versions may still be accessible through document history
- Consider this when encrypting sensitive information

### Password Recovery
- **If you lose your password, decryption is impossible**
- There is no password recovery mechanism
- Always store passwords securely

### Account Security
- This script doesn't protect against Google account compromise
- Ensure your Google account uses strong authentication (2FA recommended)

### Network Security
- The script loads CryptoJS from a CDN
- Requires internet connection for initial library loading
- All encryption/decryption happens locally in your browser

## 🛠️ Technical Details

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Google Doc    │───▶│   Apps Script    │───▶│   CryptoJS      │
│                 │    │                  │    │                 │
│ - Text Selection│    │ - Menu Interface │    │ - AES-256-CBC   │
│ - UI Interaction│    │ - Error Handling │    │ - PBKDF2        │
│ - Document API  │    │ - Text Processing│    │ - Random Gen.   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### File Structure

```
encryption-script.gs
├── Core Functions
│   ├── onOpen()                    # Menu initialization
│   ├── encryptSelection()          # Main encryption workflow
│   └── decryptSelection()          # Main decryption workflow
├── Cryptographic Functions
│   ├── loadCryptoJS()             # Library loading
│   ├── encryptText()              # Text encryption
│   ├── decryptText()              # Text decryption
│   └── generateRandomWordArray()   # Random number generation
├── Text Processing
│   ├── extractSelectedText()       # Selection handling
│   ├── normalizeLineBreaks()      # Line break normalization
│   └── replaceSelectedText()      # Text replacement
├── Utility Functions
│   ├── getPassword()              # Password input with validation
│   └── showAbout()                # Information dialog
└── Testing Functions
    ├── testEncryptionDetailed()   # Encryption system test
    └── testLineBreakHandling()    # Line break handling test
```

### Supported Content Types

**Note that: Formatting will be lost**

- ✅ Plain text
- ✅ Multi-line text with line breaks
- ✅ Paragraphs
- ✅ List items
- ❌ Tables (text content)
- ❌ Images and other media
- ❌ Text formatting (bold, italic, etc.) - will be lost

## 🔧 Troubleshooting

### Common Issues

#### "No Selection" Error
- **Cause**: No text selected or selection contains non-text elements
- **Solution**: Ensure you've selected actual text content by clicking and dragging

#### "Encryption Failed" Error
- **Cause**: Usually network connectivity or CryptoJS loading issues
- **Solution**: Check internet connection and try again

#### "Decryption Failed" Error
- **Cause**: Wrong password or corrupted ciphertext
- **Solution**: Verify you're using the correct password and selected the complete encrypted text

#### Menu Not Appearing
- **Cause**: Script not properly installed or permissions not granted
- **Solution**: Refresh the document and check that the script is saved and permissions are granted

### Debug Mode

The script includes built-in debugging:

1. Go to **Apps Script Editor**
2. Run `testEncryptionDetailed()` function
3. Check **View → Logs** for detailed information

### Browser Console

For additional debugging:
1. Press **F12** in your browser
2. Check the **Console** tab for JavaScript errors
3. Look for specific error messages when using the script


## 📝 Version History

### v1.0.0 (June 2025)
- Initial release
- AES-256-CBC encryption with PBKDF2
- Custom Google Docs menu integration
- Line break preservation
- Comprehensive error handling
- CryptoJS integration with fallback random generation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**⭐ If you find this project useful, please consider giving it a star!**

Made with ❤️ for the Google Docs community