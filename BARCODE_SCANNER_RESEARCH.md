# Barcode Scanner Library Research

## Executive Summary

Current implementation uses **html5-qrcode v2.3.8**, which is based on ZXing-js. Research indicates this library has known reliability issues, particularly with UPC barcodes and challenging scanning conditions (poor lighting, damaged codes, mobile browsers).

For scanning UPC barcodes and house-printed SKU barcodes reliably, commercial solutions significantly outperform open-source alternatives in accuracy, speed, and handling of real-world conditions.

---

## Current Implementation: html5-qrcode

**Location**: `src/components/BarcodeScanner.tsx`

**Configuration**:
- FPS: 10 frames per second
- QR Box: 250x250 pixels
- Aspect Ratio: 1.0

### Known Issues

1. **Based on ZXing-js** which was intentionally designed for speed over 100% detection rate
2. **Poor performance** compared to QuaggaJS and Scandit in quality and speed benchmarks
3. **UPC barcode detection issues** particularly on iOS devices
4. **Struggles with**:
   - Poor lighting conditions
   - Damaged or faded barcodes
   - Big QR codes (works in ZXing demos but not html5-qrcode)
   - Mobile browsers, especially iPhones
5. **Design philosophy**: Optimized for video streams where "eventually one image will be readable" rather than first-try accuracy

---

## Alternative Solutions

### Open-Source Options

#### 1. ZXing (zxing-js/browser)

**GitHub**: https://github.com/zxing-js/browser
**Status**: Maintenance mode (only bug fixes, no new features)

**Pros**:
- Multi-format support (1D/2D barcodes)
- TypeScript support
- Broad platform compatibility
- Free and open-source

**Cons**:
- Struggles with poorly lit, very small, or damaged codes
- Low recognition rates for challenging barcodes
- Performance varies significantly by device
- Slower on lower-end hardware
- May not work reliably on newer devices

**Accuracy Improvements Available**:
- `TRY_HARDER` decode hint
- `ASSUME_GS1` hint
- Focused scanning area (center of screen)
- Higher resolution camera streams

**Best For**: Basic barcode scanning with good lighting and undamaged codes

---

#### 2. Quagga2

**GitHub**: https://github.com/ericblade/quagga2
**NPM**: `@ericblade/quagga2`
**Status**: Active maintenance (fork of discontinued QuaggaJS)

**Pros**:
- Specialized in 1D barcodes (Code 128, EAN, UPC, etc.)
- Actively maintained
- Works well in desktop environments
- Free and open-source

**Cons**:
- **Critical reliability issues**:
  - Occasionally detects different EAN than the one scanned
  - False positives causing inventory errors
  - Precision issues with EAN barcodes in production
- Breaks in mobile browsers, especially iPhones
- Poor lighting and damaged barcodes severely impact accuracy
- More decoders = more false positives

**Recommended Mitigations**:
- Scan multiple times (3x) and compare results
- Use `barcode-validator` library for check-digit validation
- Implement confidence threshold checking
- Server-side validation of scanned codes

**Best For**: Desktop web applications with validation safeguards (not recommended for mobile inventory apps)

---

#### 3. Native Barcode Detection API

**Documentation**: https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API
**Status**: Experimental technology

**Browser Support**:
- ✅ Chrome/Chromium/Edge (full support)
- ⚠️ Safari (behind feature flag)
- ❌ Firefox (feature request exists, no implementation)

**Pros**:
- Native browser implementation (no external library)
- Built directly into the browser
- No additional bundle size

**Cons**:
- Limited browser support (Chrome only for most users)
- Experimental/unstable
- Cannot rely on this for production without fallback

**Polyfill Available**: ZXing compiled to WebAssembly

**Best For**: Progressive enhancement in Chrome-only environments

---

### Commercial Solutions

#### 1. Dynamsoft Barcode Reader ⭐ RECOMMENDED

**Website**: https://www.dynamsoft.com/barcode-reader/sdk-javascript/
**NPM**: `dynamsoft-javascript-barcode`

**Pricing**:
- Starting at $1,249/year (unlimited scans)
- No per-scan fees
- 30-day free trial

**Barcode Support**:
- Code 39, Code 32, Code 93, Code 128, Codabar
- Interleaved 2 of 5
- **EAN-8, EAN-13, UPC-A, UPC-E** ✅
- QR Code, Data Matrix, PDF417, Aztec, MaxiCode, DotCode

**Key Features**:
- **Industry-leading algorithms** for exceptional speed, accuracy, and read rates
- Client-side processing (no server calls)
- WebAssembly-based for high performance
- Integration in just a few lines of code
- 200+ APIs for customization
- Pre-built UI components
- Customizable templates for challenging barcodes
- Handles blurry, low-contrast, poorly printed, scratched, dirty, or partially damaged barcodes

**Best For**: Production inventory/asset tracking requiring high accuracy

---

#### 2. STRICH

**Website**: https://strich.io

**Pricing**:
- Basic: $99/year (10k scans/month)
- Professional: 100k scans/month
- Enterprise: Unlimited scans (up to $5,000/year)
- 30-day free trial (credit card required)

**Key Features**:
- Advanced image processing improves read rates over ZXing/Quagga
- Fully supports inverted codes (light on dark background)
- Fast scans, even for small barcodes
- Regular updates and technical support included
- Handles faded ink, damaged bars, uneven illumination

**Cons**:
- Performance issues in low light (though this affects all video-feed scanners)

**Best For**: Mid-size applications with moderate scanning volume

---

#### 3. Scanbot SDK

**Website**: https://scanbot.io/barcode-scanner-sdk/web-barcode-scanner/

**Pricing**:
- Unlimited scanning at fixed annual fee
- Contact for quote
- 7-day free trial

**Key Features**:
- Scans in under 0.04s
- Integration in less than 1 hour
- All common symbologies (EAN, UPC, Code128, PDF417, etc.)
- Single barcode, Scan & Count, AR find-and-pick modes
- **Everything processes locally** (no data transmission)
- Free developer support (Slack, Teams, email)

**Best For**: Enterprise applications requiring fastest scan times

---

#### 4. Scandit

**Website**: https://www.scandit.com/products/web-sdk/

**Pricing**:
- Contact for quote
- 30-day free trial

**Key Features**:
- Fast, accurate, reliable for wide angles, long distances, tiny barcodes
- 30+ symbology support
- Batch scanning and AR APIs
- Integration in as little as 10 lines of code
- WebAssembly-based
- Data capture up to 7x faster
- Handles poor light, damaged codes, crowded environments

**Best For**: Large-scale enterprise deployments

---

## Comparison Matrix

| Library | Type | UPC Support | Accuracy | Mobile | Damaged Codes | Pricing | Best For |
|---------|------|-------------|----------|--------|---------------|---------|----------|
| **html5-qrcode** (current) | Open-source | ⚠️ Issues | Low | ❌ iPhone issues | ❌ | Free | Basic use only |
| **ZXing-js** | Open-source | ✅ | Medium | ⚠️ Varies | ❌ | Free | Good lighting only |
| **Quagga2** | Open-source | ⚠️ False positives | Low-Medium | ❌ Breaks on iPhone | ❌ | Free | Desktop only |
| **Barcode Detection API** | Browser native | ✅ | Unknown | ⚠️ Chrome only | Unknown | Free | Not production-ready |
| **Dynamsoft** | Commercial | ✅ Excellent | Very High | ✅ | ✅ | $1,249/yr | Production inventory |
| **STRICH** | Commercial | ✅ | High | ✅ | ✅ | $99-5k/yr | Mid-size apps |
| **Scanbot** | Commercial | ✅ Excellent | Very High | ✅ | ✅ | Custom quote | Enterprise speed |
| **Scandit** | Commercial | ✅ Excellent | Very High | ✅ | ✅ | Custom quote | Large enterprise |

---

## Recommendations

### For UPC Barcodes and House-Printed SKU Barcodes

Based on your requirements (reliable UPC scanning and house-printed SKU barcodes):

#### 🥇 Top Recommendation: **Dynamsoft Barcode Reader**

**Why**:
1. **Excellent UPC/EAN support** (specifically lists UPC-A, UPC-E, EAN-8, EAN-13)
2. **Handles challenging conditions** (damaged, poorly printed, scratched, dirty codes)
3. **Transparent pricing** ($1,249/year unlimited scans - clear ROI)
4. **Quick integration** (few lines of code)
5. **No per-scan fees** (important for inventory applications)
6. **Client-side processing** (no privacy/latency concerns)
7. **Industry-leading accuracy** for real-world conditions

**House-printed SKU considerations**: The customizable templates feature is ideal for optimizing recognition of your specific label printer output.

---

#### 🥈 Budget Alternative: **STRICH**

**Why**:
1. **Affordable entry point** ($99/year for 10k scans)
2. **Better accuracy than open-source** alternatives
3. **Supports inverted codes** (useful if you print white-on-black labels)
4. **30-day trial** to validate before committing

**Limitations**: May struggle in low-light conditions (test thoroughly in your actual warehouse/store environment)

---

#### 🥉 Free Option with Caveats: **ZXing-js/browser**

**Only if**:
- Budget constraints prevent commercial solution
- Scanning environment has excellent lighting
- Barcodes are always in good condition
- Desktop browser primarily (not mobile-focused)
- Can implement retry logic and validation

**Implementation improvements**:
```javascript
// Use TRY_HARDER hint
const hints = new Map();
hints.set(DecodeHintType.TRY_HARDER, true);

// Validate results
import BarcodeValidator from 'barcode-validator';
if (!BarcodeValidator.isValid(result)) {
  // Prompt for rescan
}
```

---

### Migration Path

#### Phase 1: Trial & Validation (Week 1-2)
1. Sign up for **Dynamsoft 30-day trial** and **STRICH 30-day trial**
2. Create proof-of-concept implementations for both
3. Test with:
   - Your actual UPC barcodes
   - Your house-printed SKU labels
   - Actual lighting conditions in your facility
   - Mobile devices your staff uses
   - Damaged/worn labels from real inventory

#### Phase 2: Performance Testing (Week 2-3)
1. Measure scan success rate (% successful first-try scans)
2. Measure scan speed (time to successful scan)
3. Test edge cases:
   - Worst lighting conditions
   - Most damaged labels in inventory
   - Smallest barcodes
   - Angled/curved surfaces

#### Phase 3: Decision & Implementation (Week 3-4)
1. Select library based on test results and budget
2. Implement in `src/components/BarcodeScanner.tsx`
3. Add validation logic specific to your SKU format
4. User acceptance testing with actual staff

---

## Implementation Considerations

### For House-Printed SKU Barcodes

**Critical factors**:
1. **Barcode type**: What symbology are you printing? (Code 128, Code 39, etc.)
2. **Print quality**: DPI and printer type affect scanability
3. **Label size**: Smaller labels require better algorithms
4. **Label material**: Glossy labels may cause glare issues

**Recommendations**:
- Use **Code 128** for alphanumeric SKUs (most compact, widely supported)
- Print at **300 DPI minimum** for reliable scanning
- Include **quiet zones** (white space) around barcodes
- Test label durability in actual warehouse conditions
- Consider upgrading to commercial solution if printing custom labels

### Code Changes Required

The switch should be relatively straightforward as the interface is similar:

**Current** (html5-qrcode):
```typescript
const html5QrCode = new Html5Qrcode('reader');
await html5QrCode.start(cameraId, config, onSuccess, onError);
```

**Dynamsoft example**:
```typescript
await BarcodeScanner.loadWasm();
const scanner = await BarcodeScanner.createInstance();
scanner.onFrameRead = results => { /* handle */ };
await scanner.show();
```

Main changes needed:
- Update `src/components/BarcodeScanner.tsx`
- Update `package.json` dependency
- May need different camera permission handling
- Update UI elements if using pre-built components

---

## Cost-Benefit Analysis

### Current Situation
- **Cost**: $0/year
- **Scan success rate**: Estimated 60-75% (based on reported issues)
- **User frustration**: High (multiple scan attempts)
- **Time wasted**: ~15-30 seconds per problematic barcode

### With Dynamsoft ($1,249/year)
- **Cost**: $1,249/year
- **Scan success rate**: Estimated 95-99%
- **User productivity**: 2-3x improvement on challenging scans
- **Break-even**: ~5 hours/month of saved employee time (at $25/hr wage)

**ROI calculation**: If employees scan 50+ items per day, the time savings easily justify the cost.

---

## Sources

### Open-Source Libraries
- [ZXing-js GitHub](https://github.com/zxing-js/library)
- [ZXing-js Browser](https://github.com/zxing-js/browser)
- [ZXing Barcode Scanner Tutorial - Scanbot](https://scanbot.io/techblog/zxing-barcode-scanner-tutorial/)
- [Quagga2 GitHub](https://github.com/ericblade/quagga2)
- [QuaggaJS Official Site](https://serratus.github.io/quaggaJS/)
- [QuaggaJS Tutorial - Scanbot](https://scanbot.io/techblog/quagga-js-tutorial/)
- [Barcode Detection API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API)

### Commercial Solutions
- [Dynamsoft Barcode Reader JavaScript SDK](https://www.dynamsoft.com/barcode-reader/sdk-javascript/)
- [Dynamsoft GitHub](https://github.com/Dynamsoft/barcode-reader-javascript)
- [Dynamsoft Pricing](https://www.dynamsoft.com/store/dynamsoft-barcode-reader/)
- [STRICH Official Site](https://strich.io/)
- [STRICH Pricing - Capterra](https://www.capterra.com/p/10020686/STRICH/)
- [Scanbot Barcode Scanner SDK](https://scanbot.io/barcode-scanner-sdk/)
- [Scanbot Web SDK](https://scanbot.io/barcode-scanner-sdk/web-barcode-scanner/)
- [Scandit Web SDK](https://www.scandit.com/products/web-sdk/)
- [Scandit Pricing](https://www.scandit.com/pricing/)

### Comparisons & Analysis
- [Popular JavaScript Barcode Scanners: Open-Source Edition - Scanbot](https://scanbot.io/blog/popular-open-source-javascript-barcode-scanners/)
- [2025 Best Barcode Scanners for Your App - DEV Community](https://dev.to/patty-1984/2025-the-best-barcode-scanners-for-your-app-30hk)
- [JavaScript Barcode Libraries Comparison](https://www.webdevtutor.net/blog/javascript-barcode-library)
- [html5-qrcode Performance Issue #582](https://github.com/mebjas/html5-qrcode/issues/582)
- [zxing-js UPC Detection Issues #605](https://github.com/mebjas/html5-qrcode/issues/605)
- [JavaScript Barcode Scanner Developer's Guide - Scandit](https://www.scandit.com/blog/add-javascript-barcode-scanner-to-web-apps/)

---

## Next Steps

1. **Immediate**: Test current implementation with your actual inventory labels
2. **This Week**: Sign up for Dynamsoft and STRICH trials
3. **Week 1-2**: Build POC implementations
4. **Week 2-3**: Conduct side-by-side testing
5. **Week 3-4**: Make final decision and implement

**Questions to answer during testing**:
- What is your actual scan success rate with html5-qrcode?
- What % of scans require multiple attempts?
- How many scans per day per user?
- What is the ROI threshold for a paid solution?
- Are there specific problematic barcode formats in your inventory?

---

*Research completed: 2025-11-26*
