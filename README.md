# onioncrawler
# Universal Onion Directory Crawler

A Tampermonkey/Greasemonkey userscript that recursively crawls directory listings on Tor hidden services (.onion sites) and exports discovered file URLs to a text file.

## Features

- **Universal Detection**: Automatically detects various directory listing formats (Apache, nginx, table-based listings)
- **Recursive Crawling**: Discovers and crawls subdirectories automatically
- **Rate Limiting**: Built-in 500ms delay between requests to avoid overwhelming servers
- **Safety Controls**: Maximum depth limit (50) prevents infinite loops
- **Real-time UI**: Fixed control panel shows live progress (files found, directories crawled, queue size)
- **Easy Export**: One-click download of all discovered file URLs as a sorted text file
- **Stop & Resume**: Stop crawling at any time and export partial results
- **Smart Filtering**: Ignores external links, parent directories, and non-file URLs
- **Same-Domain Only**: Only crawls URLs within the same .onion domain

## Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)

2. Click on the raw `onion_crawler.js` file in this repository

3. Your userscript manager should prompt you to install it

4. Confirm the installation

## Usage

1. **Access a .onion site** through Tor Browser or a Tor-enabled browser

2. **Navigate to a directory listing** page (e.g., `http://example.onion/files/`)

3. **Look for the crawler UI** in the top-right corner of the page
   - The UI only appears on detected directory listings
   - Shows a dark control panel with spider emoji 🕷️

4. **Click "Start Crawl"** to begin recursive crawling
   - Watch real-time statistics update
   - Files found counter
   - Directories crawled counter
   - Queue size (pending directories)

5. **Wait or stop early**:
   - Let it complete automatically, or
   - Click "Stop & Export" to download partial results

6. **Download results**: A text file will be automatically downloaded with format:
   ```
   crawl_[hostname]_[timestamp].txt
   ```

## Configuration

Edit these constants at the top of the script to customize behavior:

```javascript
const CRAWL_DELAY = 500;  // Milliseconds between requests (default: 500ms)
const MAX_DEPTH = 50;     // Maximum directory depth (default: 50)
```

## Output Format

The exported text file contains one URL per line, sorted alphabetically:

```
http://example.onion/files/document1.pdf
http://example.onion/files/document2.txt
http://example.onion/files/images/photo1.jpg
http://example.onion/files/images/photo2.png
```

## How It Works

1. **Detection**: Checks page title and content for directory listing indicators
2. **Parsing**: Extracts links from the page, distinguishing files from directories
3. **Queue Management**: Maintains a queue of directories to crawl
4. **Recursion**: Processes each directory, adding new directories to queue
5. **Deduplication**: Tracks visited directories to avoid crawling twice
6. **Export**: Generates and downloads a sorted list of all discovered files

## Compatibility

- **Browsers**: Works with any browser that supports Tor and userscript managers
- **Directory Formats**:
  - Apache-style listings
  - nginx auto-index
  - Table-based directory pages
  - Custom HTML listings with links

## Privacy & Safety

- **No external requests**: Only communicates with the .onion site you're viewing
- **Same-domain restriction**: Won't follow links to other .onion addresses
- **Rate limited**: Respects server resources with built-in delays
- **Client-side only**: All processing happens in your browser
- **No data collection**: No analytics or external logging

## Use Cases

- Archiving/backing up onion site file repositories
- Cataloging research datasets on academic onion sites
- Discovering available resources on file servers
- Creating offline indexes of large directory structures

## Limitations

- Only works on sites with visible directory listings
- Cannot bypass authentication or access controls
- Requires JavaScript-enabled directory pages
- Maximum depth limit prevents crawling extremely deep structures

## Troubleshooting

**UI doesn't appear:**
- Ensure you're on a directory listing page (look for "Index of" in title)
- Check browser console for errors
- Verify Tampermonkey is enabled for .onion sites

**Crawl stops early:**
- Check console for errors
- Verify the site's directory structure
- Increase MAX_DEPTH if needed

**Missing files in output:**
- Some links may not follow standard patterns
- Check if links are absolute vs relative URLs
- Review console logs for parsing warnings

## License

MIT License - Feel free to modify and distribute

## Disclaimer

This tool is provided for legitimate use cases such as archiving, research, and cataloging publicly accessible content. Users are responsible for complying with applicable laws and the terms of service of websites they access. Use responsibly and ethically.

## Contributing

Contributions welcome! Please submit pull requests or open issues for:
- Bug fixes
- Support for additional directory listing formats
- Performance improvements
- UI enhancements

## Version History

- **v2.0**: Current version with universal directory format support
- Features recursive crawling, real-time UI, and automatic export
