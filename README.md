# Google Docs Encryption Add-on

```
DISCLAIMER: This script as well as the documentation is vibe coded by me using claude sonnet 4.0
```

A simple Google Apps Script that lets you encrypt and decrypt selected text in Google Docs with a password.

## 🔐 What it does

- Select any text in Google Docs
- Encrypt it with a password (uses AES-256 encryption)
- Decrypt it later with the same password
- Adds a simple menu to Google Docs for easy access

## 🚀 Installation

1. **Open your Google Doc**
2. **Go to Extensions → Apps Script**
3. **Delete the default code and paste the script** from `Code.gs`
4. **Save the project** (Ctrl+S)
5. **Run the script** to grant permissions
6. **Refresh your Google Doc** - you'll see a "🔐 Encryption" menu

## 📖 How to use

### Encrypt text:
1. Select text in your document
2. Click **🔐 Encryption → Encrypt Selection**
3. Enter a password
4. Your text becomes encrypted gibberish

### Decrypt text:
1. Select the encrypted text
2. Click **🔐 Encryption → Decrypt Selection**
3. Enter the same password
4. Your original text appears

## ⚠️ Important warnings

- **If you forget your password, your text is gone forever**
- **Google Docs keeps version history** - old unencrypted versions might still exist
- **Use strong passwords** (12+ characters recommended)
- **This won't protect against Google account hacking**

## 🪲Currently Known Bugs
- After encrypting the text when line break is included in the text then it will keep the original text also after encyption. You need to delete that yourself.

## 🛠️ Troubleshooting

**"No Selection" error?**
- Make sure you actually selected some text

**"Encryption Failed" error?**
- Check your internet connection and try again

**"Decryption Failed" error?**
- Make sure you're using the correct password
- Make sure you selected all the encrypted text

**Menu not showing?**
- Refresh the Google Doc page
- Check that you saved the script properly

## 🔒 Security notes

- Uses AES-256 encryption
- Each encryption is unique (even with same password)
- Passwords are never saved anywhere
- Works entirely in your browser

## 📝 What works and what doesn't

✅ **Works with:**
- Regular text
- Multi-line text
- Paragraphs
- Lists

❌ **Doesn't work with:**
- Images
- Text formatting (bold, italic, etc.) will be lost

## 📄 License

MIT License - free to use and modify.

---