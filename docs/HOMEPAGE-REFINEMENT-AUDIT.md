# Sword Institute Homepage Refinement Audit

**Date**: 2026-07-12  
**Status**: Pre-Implementation Audit  
**Scope**: Homepage refinement (index.html) only

---

## 1. CURRENT STATE ANALYSIS

### 1.1 Strengths
- ✅ **Apple-inspired Glass UI**: Excellent pearlescent (FCFAF5), violet (#8B00FF), and gold (#FFD700) color system
- ✅ **Responsive grid layouts**: All sections use CSS Grid with auto-fill/minmax
- ✅ **Accessibility basics**: ARIA labels present, semantic HTML structure
- ✅ **Performance considerations**: Lazy section loading with IntersectionObserver
- ✅ **Firebase integration**: Authentication and Firestore already wired
- ✅ **Modular CSS**: Separate stylesheets for shared components, professorSword, academies
- ✅ **Dynamic content loading**: homeCourses.js, academies.js fetch real Firestore data

---

## 2. IDENTIFIED ISSUES

### 2.1 **UI DUPLICATION & CLUTTER**

#### Issue: Professor SWORD Component Appears Multiple Times
- **Current**: Single Professor SWORD card in hero (ai-mentor-card)
- **Codebase has**: 
  - `js/components/professorSwordWidget.js` (unused on homepage)
  - `dashboard.html` has separate Professor SWORD buttons
  - `ai-message.html` (dedicated page, separate from homepage)
- **Impact**: Cognitive load, inconsistent styling potential
- **Fix**: Keep only hero version, ensure component reusability across pages

#### Issue: Navigation Has Multiple Auth Controls
- **Current**: `identityHubHost` (Microsoft Entra ID)
- **Also has**: `loginLink`, `registerLink`, `dashboardLink` (fallback elements)
- **Problem**: Complex state management, multiple visibility toggles
- **Proposed**: Replace with single profile avatar dropdown (authenticated) + simple login/register (unauthenticated)

#### Issue: Dashboard Button Logic Is Enrollment-Gated
- **Current**: Dashboard only appears if user has active enrollment
- **Problem**: Complex async check on every auth state change
- **Opportunity**: Simplify to show dashboard always for authenticated users (redirect to empty state if no enrollment)

### 2.2 **SECTIONS COMPETING FOR ATTENTION**

#### Issue: Hero Section Is Dense
- **Current layout**: 2-column (content left, Professor SWORD card right)
- **Current elements**:
  - Eyebrow text ("Premium learning...")
  - Main headline with gradient spans
  - Description paragraph
  - Two CTA buttons
  - Hero meta badges
  - Professor SWORD card (420px max-width)
- **Problem**: Too many elements, visual hierarchy unclear
- **Fix**: Reduce hero-meta to one line, ensure Professor SWORD is visually secondary but accessible

#### Issue: Statistics Section Excessive Padding
- **Current**: `padding: 24px 12px` per stat card
- **Appearance**: Vertically tall cards that feel bloated
- **Target reduction**: ~30% → approximately `padding: 16px 12px` or `padding: 14px 10px`
- **Result**: Same information, more compact, tighter rhythm

#### Issue: "Explore Our Academies" Has No Visible Count
- **HTML**: Section header says "Explore Our Academies" ✓
- **Problem**: No indication of how many academies exist
- **Current behavior**: academies.js loads all from ACADEMY_DATA (currently 9+ academies)
- **Spec requirement**: Show exactly 10 academies
- **Fix**: Update ACADEMY_DATA to include 10 academies (add 1 more), display in clean 5×2 grid

#### Issue: Academy Cards Are Data-Heavy
- **Current template**: Icon + name + description + "Explore" button + meta (course count, hours, cert count, level)
- **Problem**: Competing elements, not minimal
- **Spec requirement**: Icon + name + one-line description + "Explore" button only
- **Fix**: Move course counts, hours, certificates, levels to dedicated Academy detail page

### 2.3 **FEATURED COURSES SECTION**

#### Issue: Skeleton Placeholders Are Static
- **Current**: 4 hardcoded skeleton cards in HTML
- **Problem**: Skeleton HTML is duplicated inline, not replaced until homeCourses.js loads
- **Current behavior**: homeCourses.js queries `getFeaturedCourses()` from Firestore
- **Fix**: Let homeCourses.js render 4 cards with real data, no hardcoded skeleton HTML
- **Note**: Skeleton loaders should appear dynamically only while data loads

#### Issue: Course Cards Show Insufficient Information
- **Current**: Thumbnail, title, description (2-line clamp), duration, difficulty, course-meta
- **Missing (per spec)**:
  - Certificate badge visibility (present in homeCourses.js but not guaranteed in HTML template)
  - Enroll button prominence
- **Fix**: Ensure all fields present: thumbnail, title, short description, duration, difficulty, certificate badge, Enroll button

### 2.4 **TESTIMONIALS SECTION**

#### Issue: Static Hardcoded Testimonials
- **Current**: 4 testimonials hardcoded in HTML with initials as avatars
- **Problem**: Not pulling from Firestore, not scalable, not dynamic
- **Spec requirement**: Exactly 4 testimonials, 5-star rating, 2–3 line quotes, name, role
- **Current state**: Looks good but is static
- **Decision**: Acceptable for MVP (testimonials are typically curated by admin anyway)
- **Note**: If testimonials are to be dynamic, they should be in a Firestore collection `testimonials` with: quote, author, role, rating

### 2.5 **CTA SECTION**

#### Issue: CTA Title Formatting
- **Current**: "Start Building Skills That Matter" (with violet "Starting" span)
- **Spec shows**: "Start Building Skills That Matter" ✓ (correct)
- **Current buttons**: "Start Learning" + "Browse Courses" ✓ (correct)
- **Problem**: None, this section is already compliant

### 2.6 **PERFORMANCE BOTTLENECKS**

#### Issue: Multiple Firestore Queries Without Deduplication
- **Current**: `homeCourses.js` calls `getFeaturedCourses()`
- **Current**: `academies.js` loads from hardcoded ACADEMY_DATA array
- **Potential**: If future updates move academies to Firestore, queries could duplicate
- **Fix**: Ensure courseService.js is the single source of truth for course queries

#### Issue: Lazy Section Observer
- **Current**: IntersectionObserver on `.lazy-section` with 120px top margin
- **Problem**: Good, but no indication of actual performance impact
- **Opportunity**: Confirm image lazy loading (loading="lazy" present in homeCourses.js)

#### Issue: CSS Size
- **Current**: 3+ CSS files loaded (index.css, shared-components.css, professorSword.css, academies.css)
- **Problem**: Potential redundancy, variable duplication
- **Current state**: Maintainable, acceptable

---

## 3. RECOMMENDED CHANGES (SUMMARY)

| Phase | Issue | Current | Target | Priority |
|-------|-------|---------|--------|----------|
| 2 | Hero section clarity | Dense | Simplified with focus on headline + CTA + concierge | High |
| 3 | Professor SWORD duplication | Multiple implementations | Single unified component | High |
| 4 | Statistics card padding | 24px 12px | ~16px 10px (30% reduction) | Medium |
| 5 | Academy count | Variable (9+) | Exactly 10 in 5×2 grid | Medium |
| 5 | Academy card content | Data-heavy | Icon + name + description + button only | High |
| 6 | Featured courses | 4 skeletons hardcoded | 4 real courses from Firestore | High |
| 7 | Testimonials | 4 hardcoded (acceptable) | Keep as-is or make dynamic | Low |
| 8 | CTA section | Already compliant | No changes needed | Low |
| 9 | Navigation | Multi-control complexity | Single profile dropdown | Medium |

---

## 4. FILE MODIFICATION LIST

### Critical Files to Modify
1. **index.html** (Homepage structure)
   - Reduce hero section density
   - Simplify Professor SWORD card
   - Remove hardcoded skeleton course cards
   - Simplify navigation/auth controls
   - Update statistics padding in inline styles

2. **css/index.css** (Homepage styles)
   - Reduce stat-item padding (current: 24px 12px → target: 16px 10px)
   - Adjust statistics section spacing
   - Update hero section layout if needed
   - Academy card styling updates

3. **js/academies.js** (Academy loading)
   - Ensure exactly 10 academies displayed
   - Update ACADEMY_DATA to include 10 academies
   - Filter academy card content to: icon, name, description, button only

4. **js/homeCourses.js** (Featured courses loading)
   - Ensure skeleton loaders appear dynamically only while loading
   - Render 4 real courses from Firestore
   - Include certificate badge, duration, difficulty, Enroll button

5. **js/index.js** (Homepage initialization)
   - Verify lazy loading functionality
   - Check for any console errors

6. **css/academies.css** (Academy styling)
   - Update card layout to be more compact
   - Remove styles for hidden metadata (course counts, hours, certs, level)

### Optional Files (Future Enhancement)
- `js/components/identityHub.js` (Simplify auth controls)
- `js/services/courseService.js` (Ensure single source of truth for course queries)

---

## 5. ACCESSIBILITY & PERFORMANCE BASELINE

### Current Accessibility Status
- ✅ ARIA labels on major sections
- ✅ Semantic HTML (section, nav, article, main)
- ✅ Color contrast acceptable on glass UI (needs verification)
- ⚠ Focus indicators may need enhancement
- ⚠ Screen reader testing needed for dynamic content

### Current Performance Status
- ✅ Lazy section loading implemented
- ✅ Image lazy loading attributes present (in homeCourses.js)
- ✅ CSS Grid responsive design
- ⚠ Firebase SDK version 9.23 (compat) could be upgraded to v10.14
- ⚠ No WebP image serving yet

---

## 6. VALIDATION CHECKLIST (End of Refinement)

- [ ] Only one Professor SWORD component visible
- [ ] Hero section has clear visual hierarchy (headline → CTA → concierge)
- [ ] Statistics cards visually 30% more compact
- [ ] Exactly 10 academy cards in 5×2 grid, each showing: icon, name, description, button only
- [ ] Featured Courses: 4 real courses from Firestore with all required fields
- [ ] Testimonials: 4 cards with 5-star rating, 2–3 line quotes, name, role
- [ ] CTA section: Title + subtitle + two buttons (compliant)
- [ ] Navigation: Profile dropdown for authenticated, simple login/register for unauthenticated
- [ ] No JavaScript errors in browser console
- [ ] No Firebase errors
- [ ] Page responsive: desktop, tablet (iPad), mobile (iPhone SE)
- [ ] Lazy loading verified in DevTools (Network tab)
- [ ] Accessibility: Tab navigation, ARIA labels present, focus states visible

---

## 7. IMPLEMENTATION STRATEGY

1. ✅ Phase 1 (Current): Audit complete ← **YOU ARE HERE**
2. → Phase 2-6: Modify files in priority order
3. → Phase 7-11: Implement advanced features
4. Final: Full validation and deployment

---

**Next Step**: Proceed to Phase 2 — Hero Section refinement.

